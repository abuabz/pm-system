import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login screen' })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Create the frontend login screen with validation',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-project' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ example: 'uuid-of-assignee' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 5.5 })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional({ example: 2.0 })
  @IsOptional()
  @IsNumber()
  actualHours?: number;
}
