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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from '../common/decorators/permissions.decorator';
import { TaskStatus } from '@prisma/client';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Permissions('tasks:create')
  @ApiOperation({ summary: 'Create a new task' })
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'Get tasks with pagination, filtering, and search' })
  findAll(@Query() query: TaskQueryDto, @Req() req: any) {
    return this.tasksService.findAll(query, req.user);
  }

  @Patch('bulk/update')
  @Permissions('tasks:update')
  @ApiOperation({ summary: 'Bulk update multiple tasks' })
  bulkUpdate(@Body() bulkUpdateTaskDto: BulkUpdateTaskDto, @Req() req: any) {
    return this.tasksService.bulkUpdate(bulkUpdateTaskDto, req.user);
  }

  @Get(':id')
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('tasks:update')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Patch(':id/status')
  @Permissions('tasks:update')
  @ApiOperation({ summary: 'Quickly update a task status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
    @Req() req: any,
  ) {
    return this.tasksService.updateStatus(id, status, req.user);
  }

  @Patch(':id/assign')
  @Permissions('tasks:update')
  @ApiOperation({ summary: 'Assign or unassign a task' })
  assignTask(
    @Param('id') id: string,
    @Body() assignTaskDto: AssignTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.assign(
      id,
      assignTaskDto.assigneeId || null,
      req.user,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('tasks:delete')
  @ApiOperation({ summary: 'Soft delete a task' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.remove(id, req.user);
  }
}
