import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
  ) {}

  async create(taskId: string, createCommentDto: CreateCommentDto, user: any) {
    const { content, mentionedUserIds = [] } = createCommentDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the comment
      const comment = await tx.comment.create({
        data: {
          content,
          taskId,
          authorId: user.id,
        },
      });

      // 2. Process Mentions
      if (mentionedUserIds.length > 0) {
        // Filter out duplicate user IDs and ensure they exist
        const uniqueMentionedUserIds = [...new Set(mentionedUserIds)];
        const users = await tx.user.findMany({
          where: { id: { in: uniqueMentionedUserIds }, deletedAt: null },
          select: { id: true },
        });

        const validUserIds = users.map((u) => u.id);

        if (validUserIds.length > 0) {
          // Create CommentMentions
          await tx.commentMention.createMany({
            data: validUserIds.map((userId) => ({
              commentId: comment.id,
              userId,
            })),
          });

          // Create Notifications for mentioned users
          await tx.notification.createMany({
            data: validUserIds.map((userId) => ({
              userId,
              title: 'You were mentioned',
              message: `${user.firstName} ${user.lastName} mentioned you in a comment.`,
              type: 'MENTION',
            })),
          });
        }
      }

      return comment;
    });
  }

  async findAllByTask(taskId: string, user: any) {
    // Verify task access first
    await this.tasksService.findOne(taskId, user);

    return this.prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        mentions: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  private async verifyOwnershipOrAdmin(commentId: string, user: any) {
    const comment = await this.findOne(commentId);

    // Global admin bypass or owner check
    const isOwner = comment.authorId === user.id;
    const hasGlobalPermission = user.role?.permissions?.some(
      (p: any) =>
        p.permission.action === 'update' &&
        p.permission.resource === 'comments',
    );
    const isSuperAdmin = user.role?.name === 'Super Admin';

    if (!isOwner && !hasGlobalPermission && !isSuperAdmin) {
      throw new ForbiddenException('You can only modify your own comments');
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, user: any) {
    await this.verifyOwnershipOrAdmin(id, user);

    return this.prisma.comment.update({
      where: { id },
      data: { content: updateCommentDto.content },
    });
  }

  async remove(id: string, user: any) {
    await this.verifyOwnershipOrAdmin(id, user);

    return this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
