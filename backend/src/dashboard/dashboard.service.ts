import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TaskStatus, ProjectStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(user: any) {
    const isSuperAdmin = user.role?.name === 'Super Admin';
    const userId = user.id;

    // Base filters for project visibility
    const projectFilter = isSuperAdmin
      ? { deletedAt: null }
      : { deletedAt: null, members: { some: { userId } } };

    // Base filters for task visibility (must belong to a project the user can see)
    const taskProjectFilter = isSuperAdmin
      ? { project: { deletedAt: null } }
      : { project: { deletedAt: null, members: { some: { userId } } } };

    // 1. Total Projects
    const totalProjects = await this.prisma.project.count({
      where: projectFilter,
    });

    // 2. Active Projects
    const activeProjects = await this.prisma.project.count({
      where: { ...projectFilter, status: ProjectStatus.ACTIVE },
    });

    // 3. Completed Tasks
    const completedTasks = await this.prisma.task.count({
      where: {
        ...taskProjectFilter,
        deletedAt: null,
        status: TaskStatus.DONE,
      },
    });

    // 4. Pending Tasks
    const pendingTasks = await this.prisma.task.count({
      where: {
        ...taskProjectFilter,
        deletedAt: null,
        status: { not: TaskStatus.DONE },
      },
    });

    // 5. Overdue Tasks (Utilizes the new @@index([status, dueDate]))
    const overdueTasks = await this.prisma.task.count({
      where: {
        ...taskProjectFilter,
        deletedAt: null,
        status: { not: TaskStatus.DONE },
        dueDate: { lt: new Date() },
      },
    });

    // 6. Recent Activities
    // We only fetch activities related to projects/tasks the user can see.
    // For simplicity, if not Super Admin, we just fetch logs where user is the actor,
    // or we'd need complex joins. Given time, we'll fetch global recent if Super Admin,
    // or user's recent actions if normal user.
    const recentActivities = await this.prisma.auditLog.findMany({
      where: isSuperAdmin ? {} : { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { firstName: true, lastName: true, profilePicture: true },
        },
      },
    });

    // 7. Productivity Chart Data (Tasks completed over the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Using Prisma groupBy for efficiency
    const completedTasksByDay = await this.prisma.task.groupBy({
      by: ['updatedAt'],
      where: {
        ...taskProjectFilter,
        deletedAt: null,
        status: TaskStatus.DONE,
        updatedAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    });

    // Format data for Recharts (aggregating by date string)
    const chartDataMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      chartDataMap[d.toISOString().split('T')[0]] = 0; // Initialize with 0
    }

    completedTasksByDay.forEach((group) => {
      const dateString = group.updatedAt.toISOString().split('T')[0];
      if (chartDataMap[dateString] !== undefined) {
        chartDataMap[dateString] += group._count.id;
      }
    });

    const productivityData = Object.keys(chartDataMap).map((date) => ({
      date,
      completed: chartDataMap[date],
    }));

    return {
      totalProjects,
      activeProjects,
      completedTasks,
      pendingTasks,
      overdueTasks,
      recentActivities,
      productivityData,
    };
  }
}
