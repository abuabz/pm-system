import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { AddProjectMemberDto } from './dto/add-member.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ProjectRole } from '@prisma/client';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Permissions('projects:create')
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project successfully created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: any) {
    // The user creating the project automatically becomes the OWNER via the transaction
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  @Permissions('projects:read')
  @ApiOperation({ summary: 'Get all projects with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Return paginated projects list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: ProjectQueryDto, @Req() req: any) {
    return this.projectsService.findAll(query, req.user);
  }

  @Get(':id')
  @Permissions('projects:read')
  @ApiOperation({ summary: 'Get a specific project by ID' })
  @ApiResponse({ status: 200, description: 'Return project details' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('projects:update')
  @ApiOperation({ summary: 'Update project details' })
  @ApiResponse({ status: 200, description: 'Project successfully updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: any,
  ) {
    return this.projectsService.update(id, updateProjectDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('projects:delete')
  @ApiOperation({ summary: 'Soft delete a project' })
  @ApiResponse({ status: 204, description: 'Project successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(id, req.user);
  }

  // --- Member Management ---

  @Post(':id/members')
  @Permissions('projects:update')
  @ApiOperation({ summary: 'Add a user to a project' })
  @ApiResponse({ status: 201, description: 'Member successfully added' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project or User not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddProjectMemberDto,
    @Req() req: any,
  ) {
    return this.projectsService.addMember(
      id,
      addMemberDto.userId,
      addMemberDto.role,
      req.user,
    );
  }

  @Patch(':id/members/:userId')
  @Permissions('projects:update')
  @ApiOperation({ summary: "Update a member's project role" })
  @ApiResponse({ status: 200, description: 'Member role successfully updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project member not found' })
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: ProjectRole,
    @Req() req: any,
  ) {
    return this.projectsService.updateMemberRole(id, userId, role, req.user);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('projects:update')
  @ApiOperation({ summary: 'Remove a user from a project' })
  @ApiResponse({ status: 204, description: 'Member successfully removed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project member not found' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.projectsService.removeMember(id, userId, req.user);
  }
}
