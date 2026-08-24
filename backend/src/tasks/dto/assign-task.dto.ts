import { IsUUID, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignTaskDto {
  @ApiPropertyOptional({
    example: 'uuid-of-user',
    description: 'User ID to assign the task to. Null to unassign.',
  })
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;
}
