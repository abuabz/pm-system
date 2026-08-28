import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';

import { PaginationDto } from '../../common/dto/pagination.dto';

export enum TaskSortBy {
  CREATED_AT = 'createdAt',
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class TaskQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by Project ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by Assignee ID' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskSortBy, default: TaskSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(TaskSortBy)
  sortBy?: TaskSortBy = TaskSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
