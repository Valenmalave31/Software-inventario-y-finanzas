import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Body,
  Post,
  BadRequestException,
  Request
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.alertsService.findAll(req.user);
  }

  @Post() 
  create(@Body() body: any) {
    return this.alertsService.createAlert(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('generar-vencimientos')
  generarVencimientos(@Req() req: any) {
    return this.alertsService.generarAlertasVencimientoEgresos(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.id || req.user.userId; 
    return await this.alertsService.markAllAsRead(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.alertsService.markAsRead(Number(id), req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('read')
  deleteRead(@Req() req: any) {
    return this.alertsService.deleteRead(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('unread')
  deleteUnread(@Req() req: any) {
    return this.alertsService.deleteUnread(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  deleteAll(@Req() req: any) {
    return this.alertsService.deleteAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteOne(@Param('id') id: string, @Req() req: any) {

    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID no válido');
    }
    return this.alertsService.deleteOne(numericId, req.user.id);
  }
}