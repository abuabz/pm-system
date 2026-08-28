import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, ProjectPriority } from '@prisma/client';

import { PaginationDto } from '../../common/dto/pagination.dto';

export enum ProjectSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  START_DATE = 'startDate',
  END_DATE = 'endDate',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ProjectQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for project name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    enum: ProjectPriority,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiPropertyOptional({
    enum: ProjectSortBy,
    default: ProjectSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ProjectSortBy)
  sortBy?: ProjectSortBy = ProjectSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
