import { Controller, Get } from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Permissions } from '../common/decorators/permissions.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('users:read') // Reusing users:read since admins manage users
  @ApiOperation({ summary: 'Get all available roles' })
  @ApiResponse({ status: 200, description: 'List of roles returned' })
  findAll() {
    return this.rolesService.findAll();
  }
}
