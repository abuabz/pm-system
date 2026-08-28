import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto, SortOrder } from './dto/task-query.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { Prisma, TaskStatus } from '@prisma/client';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Helper to verify if the user is authorized to access the project.
   * Super Admins can access everything. Otherwise, the user must be a ProjectMember.
   */
  private async verifyProjectAccess(projectId: string, user: any) {
    if (user.role?.name === 'Super Admin') return;

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (!member) {
      throw new ForbiddenException(
        `You do not have access to project ${projectId}`,
      );
    }
  }

  async create(createTaskDto: CreateTaskDto, user: any) {
    await this.verifyProjectAccess(createTaskDto.projectId, user);

    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status,
        priority: createTaskDto.priority,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate).toISOString() : undefined,
        estimatedHours: createTaskDto.estimatedHours,
        actualHours: createTaskDto.actualHours,
        projectId: createTaskDto.projectId,
        assigneeId: createTaskDto.assigneeId,
        reporterId: user.id,
      },
    });

    if (task.assigneeId) {
      this.eventEmitter.emit('notification.send', {
        userId: task.assigneeId,
        title: 'New Task Assigned',
        message: `You have been assigned to task: ${task.title}`,
        type: 'TASK_ASSIGNED',
      });
    }

    return task;
  }

  async findAll(query: TaskQueryDto, user: any) {
    const {
      page = 1,
      limit = 10,
      search,
      projectId,
      assigneeId,
      status,
      priority,
      sortBy = 'createdAt',
      sortOrder = SortOrder.DESC,
    } = query;
    const skip = (page - 1) * limit;

    // If projectId is provided, verify access right away
    if (projectId) {
      await this.verifyProjectAccess(projectId, user);
    }

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      ...(projectId && { projectId }),
      ...(assigneeId && { assigneeId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // If no specific project is requested and the user isn't Super Admin,
    // restrict results to projects they are members of.
    if (!projectId && user.role?.name !== 'Super Admin' && user.role?.name !== 'Admin') {
      where.project = {
        members: {
          some: { userId: user.id },
        },
      };
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: {
            select: { id: true, name: true }
          },
          assignee: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          _count: {
            select: {
              comments: { where: { deletedAt: null } },
              attachments: { where: { deletedAt: null } }
            }
          }
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        project: { select: { id: true, name: true } },
        attachments: { where: { deletedAt: null } },
        _count: {
          select: {
            comments: { where: { deletedAt: null } },
            attachments: { where: { deletedAt: null } }
          }
        }
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.verifyProjectAccess(task.projectId, user);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: any) {
    const task = await this.findOne(id, user);

    // If moving task to another project, verify access to the new project too
    if (updateTaskDto.projectId && updateTaskDto.projectId !== task.projectId) {
      await this.verifyProjectAccess(updateTaskDto.projectId, user);
    }

    if (updateTaskDto.dueDate) {
      updateTaskDto.dueDate = new Date(updateTaskDto.dueDate).toISOString();
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });

    if (
      updateTaskDto.assigneeId &&
      updateTaskDto.assigneeId !== task.assigneeId
    ) {
      this.eventEmitter.emit('notification.send', {
        userId: updateTaskDto.assigneeId,
        title: 'New Task Assigned',
        message: `You have been assigned to task: ${updatedTask.title}`,
        type: 'TASK_ASSIGNED',
      });
    }

    return updatedTask;
  }

  async remove(id: string, user: any) {
    await this.findOne(id, user);

    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatus(id: string, status: TaskStatus, user: any) {
    await this.findOne(id, user);

    return this.prisma.task.update({
      where: { id },
      data: { status },
    });
  }

  async assign(id: string, assigneeId: string | null, user: any) {
    const task = await this.findOne(id, user);

    // If assigning to a user, ideally we should verify the assignee is in the project
    if (assigneeId) {
      const member = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: task.projectId, userId: assigneeId },
        },
      });
      if (!member) {
        throw new BadRequestException(
          'Assignee must be a member of the project',
        );
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { assigneeId },
    });

    if (assigneeId && assigneeId !== task.assigneeId) {
      this.eventEmitter.emit('notification.send', {
        userId: assigneeId,
        title: 'New Task Assigned',
        message: `You have been assigned to task: ${updatedTask.title}`,
        type: 'TASK_ASSIGNED',
      });
    }

    return updatedTask;
  }

  async bulkUpdate(bulkUpdateTaskDto: BulkUpdateTaskDto, user: any) {
    const { taskIds, updateData } = bulkUpdateTaskDto;

    // Verify user has access to all requested tasks
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: taskIds }, deletedAt: null },
      select: { id: true, projectId: true },
    });

    if (tasks.length !== taskIds.length) {
      throw new NotFoundException(
        'One or more tasks were not found or are deleted',
      );
    }

    // Check project access for each distinct project
    const projectIds = [...new Set(tasks.map((t) => t.projectId))];
    for (const pId of projectIds) {
      await this.verifyProjectAccess(pId, user);
    }

    if (updateData.projectId) {
      await this.verifyProjectAccess(updateData.projectId, user);
    }

    // Execute bulk update in a transaction
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.task.updateMany({
        where: { id: { in: taskIds } },
        data: updateData as any,
      });
      return { updatedCount: result.count };
    });
  }
}
