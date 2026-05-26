import { Sale } from '../../sales/entities/sales.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ length: 150, unique: true })
  correo: string;

  @Column({ length: 255 })
  contrasena: string;

  @OneToMany(() => Sale, (sale) => sale.user)
  @Exclude()
  sales: Sale[];

  @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  passwordUpdatedAt: Date;
}
