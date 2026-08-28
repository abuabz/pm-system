import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaService } from '../database/prisma.service';
import { TasksExcelService } from './tasks.excel.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksExcelService, PrismaService],
  exports: [TasksService, TasksExcelService],
})
export class TasksModule {}
