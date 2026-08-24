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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: any) {
    // The user creating the project automatically becomes the OWNER via the transaction
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  @Permissions('projects:read')
  @ApiOperation({ summary: 'Get all projects with pagination and filtering' })
  findAll(@Query() query: ProjectQueryDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @Permissions('projects:read')
  @ApiOperation({ summary: 'Get a specific project by ID' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('projects:update')
  @ApiOperation({ summary: 'Update project details' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('projects:delete')
  @ApiOperation({ summary: 'Soft delete a project' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  // --- Member Management ---

  @Post(':id/members')
  @Permissions('projects:update')
  @ApiOperation({ summary: 'Add a user to a project' })
  addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(
      id,
      addMemberDto.userId,
      addMemberDto.role,
    );
  }

  @Patch(':id/members/:userId')
  @Permissions('projects:update')
  @ApiOperation({ summary: "Update a member's project role" })
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: ProjectRole,
  ) {
    return this.projectsService.updateMemberRole(id, userId, role);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('projects:update')
  @ApiOperation({ summary: 'Remove a user from a project' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, userId);
  }
}
