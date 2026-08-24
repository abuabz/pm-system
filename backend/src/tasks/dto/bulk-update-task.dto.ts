import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateTaskDto } from './update-task.dto';

export class BulkUpdateTaskDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => UpdateTaskDto)
  updateData: UpdateTaskDto;
}
