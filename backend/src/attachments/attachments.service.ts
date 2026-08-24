import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from './storage/storage.service';
import { FileValidatorService } from './file-validator.service';

@Injectable()
export class AttachmentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private fileValidatorService: FileValidatorService,
  ) {}

  async uploadAttachment(taskId: string, file: Express.Multer.File, user: any) {
    // 1. Validate magic bytes (security check)
    this.fileValidatorService.validateMagicBytes(
      file.buffer,
      file.originalname,
    );

    // 2. Ensure task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // 3. Upload to storage (local or cloud)
    const fileUrl = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
    );

    // 4. Save metadata to DB
    return this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        fileUrl,
        mimeType: file.mimetype,
        size: file.size,
        taskId,
        uploaderId: user.id,
      },
    });
  }

  async remove(id: string, user: any) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id, deletedAt: null },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    // Only uploader or admin can delete
    const isOwner = attachment.uploaderId === user.id;
    const isSuperAdmin = user.role?.name === 'Super Admin';
    if (!isOwner && !isSuperAdmin) {
      throw new NotFoundException(
        `You are not authorized to delete this attachment`,
      ); // Better to throw Forbidden in a real app, but NotFound hides existence
    }

    // Delete from storage
    await this.storageService.deleteFile(attachment.fileUrl);

    // Soft delete or hard delete from DB
    await this.prisma.attachment.delete({ where: { id } });

    return { message: 'Attachment deleted successfully' };
  }
}
