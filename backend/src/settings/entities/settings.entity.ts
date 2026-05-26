import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity';

@Entity('configuracion')
export class Setting {
  @PrimaryGeneratedColumn({ name: 'id_config' })
  id: number;

  @Column({ type: 'varchar', length: 20, default: 'COP' })
  moneda: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  impuesto: number;

  @Column({ type: 'boolean', default: false, name: 'retencion_activa' })
  retencionActiva: boolean;

  @Column({ type: 'integer', nullable: true, name: 'alerta_stock_min' })
  alertaStockMin: number;

  @Column({ type: 'jsonb', nullable: true, name: 'metodos_pago' })
  metodosPago: { nombre: string; activo: boolean }[];

  @Column({ name: 'notificaciones_config', type: 'jsonb', nullable: true })
  notificacionesConfig: any[];

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'enviar_email_alertas', default: false })
  enviarEmailAlertas: boolean;

  @Column({ name: 'edit_lock_owner_id', type: 'int', nullable: true })
  editLockOwnerId: number | null;

  @Column({ name: 'edit_lock_owner_name', type: 'varchar', length: 150, nullable: true })
  editLockOwnerName: string | null;

  @Column({ name: 'edit_lock_until', type: 'timestamp', nullable: true })
  editLockUntil: Date | null;
}