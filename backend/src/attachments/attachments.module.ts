import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { StorageService } from './storage/storage.service';
import { LocalStorageService } from './storage/local-storage.service';
import { FileValidatorService } from './file-validator.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    FileValidatorService,
    PrismaService,
    {
      provide: StorageService,
      useClass: LocalStorageService,
    },
  ],
})
export class AttachmentsModule {}
