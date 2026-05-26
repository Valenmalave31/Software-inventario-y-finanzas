import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity'; 
import { SaleDetail } from './sale-detail.entity';

@Entity('venta')
export class Sale {
  @PrimaryGeneratedColumn({ name: 'id_venta' })
  id: number;

  @Column({ type: 'date', name: 'fecha_venta', default: () => 'CURRENT_DATE' })
  date: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal' })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'descuento_total' })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total' })
  total: number;

  @Column({ type: 'varchar', length: 50, name: 'metodo_pago' })
  paymentMethod: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.sales, { eager: true })
  @JoinColumn({ name: 'id_usuario' })
  user: Usuario;

  @OneToMany(() => SaleDetail, (detail) => detail.sale, { cascade: true })
  details: SaleDetail[];
}
