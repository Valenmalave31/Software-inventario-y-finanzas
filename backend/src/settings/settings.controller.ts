import { Controller, Get, Patch, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Usuario } from '../auth/entities/usuario.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('settings')
@UseGuards(JwtAuthGuard) 
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findOne(@GetUser() user: Usuario) {
    return this.settingsService.findGlobalSettings(user);
  }

  @Get('lock')
  getLockStatus(@GetUser() user: Usuario) {
    return this.settingsService.getLockStatus(user);
  }

  @Post('lock')
  acquireLock(@GetUser() user: Usuario) {
    return this.settingsService.acquireLock(user);
  }

  @Delete('lock')
  releaseLock(@GetUser() user: Usuario) {
    return this.settingsService.releaseLock(user);
  }

  @Patch()
  update(
    @Body() updateSettingDto: UpdateSettingDto, 
    @GetUser() user: Usuario
  ) {
    return this.settingsService.update(user, updateSettingDto);
  }

  @Get('payment-methods')
  async getActivePayments(@GetUser() user: Usuario) {
    const config = await this.settingsService.findGlobalSettings(user);
    return config.metodosPago ? config.metodosPago.filter(m => m.activo) : [];
  }
}