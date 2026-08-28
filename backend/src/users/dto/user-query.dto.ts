import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '@prisma/client';

import { PaginationDto } from '../../common/dto/pagination.dto';

export enum UserSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  EMAIL = 'email',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AccountStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Filter by Role ID' })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({ enum: UserSortBy, default: UserSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(UserSortBy)
  sortBy?: UserSortBy = UserSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
