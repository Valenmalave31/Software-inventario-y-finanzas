import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './sales.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('detalle_venta')
export class SaleDetail {
  @PrimaryGeneratedColumn({ name: 'id_detalle' })
  id: number;

  @Column({ type: 'int', name: 'cantidad' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'precio_unitario' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal' })
  subtotal: number;

  @ManyToOne(() => Sale, (sale) => sale.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_venta' })
  sale: Sale;


  @ManyToOne(() => Product, { eager: true })   
  @JoinColumn({ name: 'id_producto' })
  product: Product;
}
