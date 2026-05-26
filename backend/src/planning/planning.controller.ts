import { Controller, Delete, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanningService } from './planning.service';

@Controller('planning')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get('overview')
  getOverview() {
    return this.planningService.getOverview();
  }

  @Get('accounting-overview')
  getAccountingOverview() {
    return this.planningService.getAccountingOverview();
  }

  @Get('alerts-overview')
  getAlertsOverview() {
    return this.planningService.getAlertsOverview();
  }

  @Get('inventory-overview')
  getInventoryOverview() {
    return this.planningService.getInventoryOverview();
  }

  @Get('accounting-report-overview')
  getAccountingReportOverview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.planningService.getAccountingReportOverview({ from, to });
  }

  @Patch('alerts/read-all')
  markAllAlertsAsRead() {
    return this.planningService.markAllAlertsAsRead();
  }

  @Patch('alerts/:id/read')
  markAlertAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.planningService.markAlertAsRead(id);
  }

  @Delete('alerts')
  deleteAllAlerts() {
    return this.planningService.deleteAllAlerts();
  }

  @Delete('alerts/read')
  deleteReadAlerts() {
    return this.planningService.deleteReadAlerts();
  }

  @Delete('alerts/unread')
  deleteUnreadAlerts() {
    return this.planningService.deleteUnreadAlerts();
  }

  @Delete('alerts/:id')
  deleteAlert(@Param('id', ParseIntPipe) id: number) {
    return this.planningService.deleteAlert(id);
  }
}