import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/settings.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  private readonly editLockMs = 2 * 60_000;

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  private defaultSettings(ownerId: number, ownerName?: string) {
    const settings = this.settingRepo.create({
      id_usuario: ownerId,
      impuesto: 0,
      retencionActiva: false,
      metodosPago: [
        { nombre: 'Efectivo', activo: true },
        { nombre: 'Transferencia', activo: true },
      ],
      notificacionesConfig: [
        { titulo: 'Stock bajo', activo: true },
        { titulo: 'Pagos pendientes', activo: true },
        { titulo: 'Metas alcanzadas', activo: true },
        { titulo: 'Resumen diario', activo: true },
      ],
      enviarEmailAlertas: false,
      editLockOwnerId: ownerId,
      editLockOwnerName: ownerName || null,
      editLockUntil: null,
    });

    return settings;
  }

  private async getGlobalSettings(user?: Usuario): Promise<Setting> {
    let settings = (await this.settingRepo.find({ order: { id: 'ASC' }, take: 1 }))[0];
    
    if (!settings) {
      settings = this.defaultSettings(user?.id || 1, user?.nombre);
      await this.settingRepo.save(settings);
    }

    return settings;
  }

  private hasActiveLock(settings: Setting) {
    return !!settings.editLockUntil && settings.editLockUntil.getTime() > Date.now();
  }

  private lockOwnerText(settings: Setting) {
    return settings.editLockOwnerName || 'otro usuario';
  }

  async getLockStatus(user: Usuario) {
    const settings = await this.getGlobalSettings(user);
    const locked = this.hasActiveLock(settings) && settings.editLockOwnerId !== user.id;

    return {
      locked,
      canEdit: !locked,
      ownerId: locked ? settings.editLockOwnerId : user.id,
      ownerName: locked ? this.lockOwnerText(settings) : user.nombre,
      remainingSeconds: locked && settings.editLockUntil
        ? Math.max(0, Math.ceil((settings.editLockUntil.getTime() - Date.now()) / 1000))
        : 0,
      expiresAt: settings.editLockUntil,
    };
  }

  async acquireLock(user: Usuario) {
    const settings = await this.getGlobalSettings(user);
    const lockExpired = !settings.editLockUntil || settings.editLockUntil.getTime() <= Date.now();
    const ownedByCurrentUser = settings.editLockOwnerId === user.id;

    if (!lockExpired && !ownedByCurrentUser) {
      throw new ConflictException(`Alguien mas esta haciendo modificaciones: ${this.lockOwnerText(settings)}`);
    }

    settings.editLockOwnerId = user.id;
    settings.editLockOwnerName = user.nombre || null;
    settings.editLockUntil = new Date(Date.now() + this.editLockMs);

    return this.settingRepo.save(settings);
  }

  async releaseLock(user: Usuario) {
    const settings = await this.getGlobalSettings(user);

    if (settings.editLockOwnerId !== user.id) {
      return settings;
    }

    settings.editLockOwnerId = null;
    settings.editLockOwnerName = null;
    settings.editLockUntil = null;

    return this.settingRepo.save(settings);
  }

  async findGlobalSettings(user: Usuario): Promise<Setting> {
    return this.getGlobalSettings(user);
  }

  async findOneByUser(user: Usuario): Promise<Setting> {
    return this.findGlobalSettings(user);
  }

  async update(user: Usuario, dto: UpdateSettingDto) {
    const settings = await this.getGlobalSettings(user);

    if (settings.editLockOwnerId !== user.id || !this.hasActiveLock(settings)) {
      throw new ConflictException('Otra persona esta haciendo modificaciones en la configuracion.');
    }

    Object.assign(settings, dto);
    settings.editLockUntil = new Date(Date.now() + this.editLockMs);

    return this.settingRepo.save(settings);
  }
}