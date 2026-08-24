import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  providers: [AuditLogsService, PrismaService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
