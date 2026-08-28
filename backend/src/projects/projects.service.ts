import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto, SortOrder } from './dto/project-query.dto';
import { Prisma, ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

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

  async create(createProjectDto: CreateProjectDto, userId: string) {
    // We use a transaction to ensure that the project and its first member (the OWNER)
    // are created atomically. If member creation fails, the project isn't created.
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: createProjectDto.name,
          description: createProjectDto.description,
          status: createProjectDto.status,
          priority: createProjectDto.priority,
          startDate: createProjectDto.startDate,
          endDate: createProjectDto.endDate,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: userId,
          role: ProjectRole.OWNER,
        },
      });

      if (createProjectDto.memberIds && createProjectDto.memberIds.length > 0) {
        // filter out owner just in case they were included
        const additionalMembers = createProjectDto.memberIds.filter(id => id !== userId);
        
        if (additionalMembers.length > 0) {
          await tx.projectMember.createMany({
            data: additionalMembers.map(id => ({
              projectId: project.id,
              userId: id,
              role: ProjectRole.MEMBER,
            })),
            skipDuplicates: true,
          });
        }
      }

      return project;
    });
  }

  async findAll(query: ProjectQueryDto, user: any) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      sortBy = 'createdAt',
      sortOrder = SortOrder.DESC,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    if (user?.role?.name !== 'Super Admin' && user?.role?.name !== 'Admin') {
      where.members = {
        some: {
          userId: user.id
        }
      };
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { members: true, tasks: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    await this.verifyProjectAccess(id, user);

    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, user: any) {
    await this.findOne(id, user); // Ensure it exists, isn't soft-deleted, and user has access

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: string, user: any) {
    await this.findOne(id, user);

    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // --- Member Management ---

  async addMember(
    projectId: string,
    userId: string,
    role: ProjectRole,
    currentUser: any,
  ) {
    await this.findOne(projectId, currentUser);

    const existingMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: { projectId, userId, role },
    });
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: ProjectRole,
    currentUser: any,
  ) {
    await this.findOne(projectId, currentUser);

    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
    });
  }

  async removeMember(projectId: string, userId: string, currentUser: any) {
    await this.findOne(projectId, currentUser);

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (member?.role === ProjectRole.OWNER) {
      throw new BadRequestException(
        'Cannot remove the project OWNER. Transfer ownership first.',
      );
    }

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    return { message: 'Member removed successfully' };
  }
}
