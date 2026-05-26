import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity'; 

@Entity({ name: 'meta' })
export class Target {
  @PrimaryGeneratedColumn({ name: 'id_meta' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'valor_objetivo', type: 'bigint' })
  targetAmount: number;

  @Column({ name: 'valor_actual', type: 'bigint', default: 0 })
  currentAmount: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  startDate: Date;

  @Column({ name: 'fecha_limite', type: 'date' })
  endDate: Date;

  @Column({ name: 'tipo_calculo', type: 'varchar', length: 150 })
  calculationType: string;

  @Column({ name: 'estado_meta', default: 'En progreso' })
  status: string;

  @Column({ name: 'id_usuario' })
  userId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  user: Usuario;
}