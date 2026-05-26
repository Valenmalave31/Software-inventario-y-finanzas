import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('alerta')
export class Alert {
  @PrimaryGeneratedColumn({ name: 'id_alerta' })
  id_alerta: number;

  @Column()
  tipo: string;

  @Column()
  mensaje: string;

  @Column({ default: false })
  leida: boolean;

  @CreateDateColumn({ name: 'fecha' }) 
  fecha: Date;

  @Column({ name: 'id_usuario' })
  id_usuario: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'id_producto' })
  producto: Product;

  @Column({ name: 'id_producto', nullable: true }) 
  id_producto: number;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'id_transaccion' })
  transaccion: Transaction;

  @Column({ name: 'id_transaccion', nullable: true })
  id_transaccion: number;
}