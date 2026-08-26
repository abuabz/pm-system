import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Permissions } from '../common/decorators/permissions.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('project-progress')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Get project progress report' })
  @ApiQuery({ name: 'projectId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return project progress metrics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getProjectProgress(@Query('projectId') projectId?: string) {
    return this.reportsService.getProjectProgress(projectId);
  }

  @Get('user-productivity')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Get user productivity report' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return user productivity metrics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getUserProductivity(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
  ) {
    return this.reportsService.getUserProductivity(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      userId,
    );
  }

  @Get('task-completion')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Get task completion report' })
  @ApiQuery({ name: 'projectId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return task completion stats' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getTaskCompletion(@Query('projectId') projectId?: string) {
    return this.reportsService.getTaskCompletion(projectId);
  }

  @Get('overdue-tasks')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Get overdue tasks report' })
  @ApiQuery({ name: 'projectId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return overdue tasks list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getOverdueTasks(@Query('projectId') projectId?: string) {
    return this.reportsService.getOverdueTasks(projectId);
  }
}
