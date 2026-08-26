import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getProjectProgress(projectId?: string) {
    const whereClause = projectId ? { projectId, deletedAt: null } : { deletedAt: null };

    // Group tasks by project and status
    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      select: {
        projectId: true,
        status: true,
        project: {
          select: { name: true },
        },
      },
    });

    // We can aggregate in memory to calculate accurate percentages per project
    const projectStats: Record<string, { name: string; total: number; done: number; statusCounts: Record<string, number> }> = {};

    for (const task of tasks) {
      if (!projectStats[task.projectId]) {
        projectStats[task.projectId] = {
          name: task.project.name,
          total: 0,
          done: 0,
          statusCounts: { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 },
        };
      }
      
      const stats = projectStats[task.projectId];
      stats.total += 1;
      stats.statusCounts[task.status] += 1;
      if (task.status === 'DONE') {
        stats.done += 1;
      }
    }

    return Object.values(projectStats).map((stat) => ({
      ...stat,
      completionPercentage: stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0,
    }));
  }

  async getUserProductivity(startDate?: Date, endDate?: Date, userId?: string) {
    const whereClause: any = {
      status: 'DONE',
      deletedAt: null,
    };

    if (userId) whereClause.assigneeId = userId;
    if (startDate || endDate) {
      whereClause.updatedAt = {};
      if (startDate) whereClause.updatedAt.gte = startDate;
      if (endDate) whereClause.updatedAt.lte = endDate;
    }

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      select: {
        assigneeId: true,
        assignee: {
          select: { firstName: true, lastName: true },
        },
        estimatedHours: true,
        actualHours: true,
      },
    });

    const userStats: Record<string, { name: string; tasksCompleted: number; totalEstimated: number; totalActual: number }> = {};

    for (const task of tasks) {
      if (!task.assigneeId) continue;
      
      if (!userStats[task.assigneeId]) {
        userStats[task.assigneeId] = {
          name: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unknown User',
          tasksCompleted: 0,
          totalEstimated: 0,
          totalActual: 0,
        };
      }

      const stats = userStats[task.assigneeId];
      stats.tasksCompleted += 1;
      stats.totalEstimated += task.estimatedHours || 0;
      stats.totalActual += task.actualHours || 0;
    }

    return Object.values(userStats);
  }

  async getTaskCompletion(projectId?: string) {
    const whereClause: any = { deletedAt: null };
    if (projectId) whereClause.projectId = projectId;

    const stats = await this.prisma.task.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        estimatedHours: true,
        actualHours: true,
      },
    });

    return stats.map(s => ({
      status: s.status,
      count: s._count.id,
      estimatedHours: s._sum.estimatedHours || 0,
      actualHours: s._sum.actualHours || 0,
    }));
  }

  async getOverdueTasks(projectId?: string) {
    const whereClause: any = {
      status: { not: 'DONE' },
      dueDate: { lt: new Date() },
      deletedAt: null,
    };
    if (projectId) whereClause.projectId = projectId;

    return this.prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { name: true } },
        assignee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
