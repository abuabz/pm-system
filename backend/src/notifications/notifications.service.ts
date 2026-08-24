import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../mail/mail.service';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  userEmail?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  @OnEvent('notification.send')
  async handleNotification(payload: NotificationPayload) {
    try {
      // 1. Persist to database for in-app bell icon
      await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
        },
      });

      // 2. Mock Email Delivery
      if (payload.userEmail) {
        await this.mailService.sendMail(
          payload.userEmail,
          payload.title,
          payload.message,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${payload.userId}`,
        error.stack,
      );
    }
  }

  async findAll(userId: string, skip: number = 0, take: number = 20) {
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items,
      meta: { total, unreadCount, skip, take },
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
