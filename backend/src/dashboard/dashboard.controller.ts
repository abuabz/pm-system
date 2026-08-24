import { Controller, Get, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get aggregated metrics for the dashboard' })
  getMetrics(@Req() req: any) {
    return this.dashboardService.getMetrics(req.user);
  }
}
