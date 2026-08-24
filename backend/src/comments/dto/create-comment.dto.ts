import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'This is a great task!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: ['uuid-of-user-1', 'uuid-of-user-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mentionedUserIds?: string[];
}
