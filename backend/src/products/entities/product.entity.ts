import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { InventoryMovement } from '../../inventory/entities/inventory-movement.entity';

@Entity('producto')
export class Product {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  id: number;

  @Column({ name: 'nombre_producto', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'precio_compra', type: 'bigint' })
  purchasePrice: number;

  @Column({ name: 'precio_venta', type: 'bigint' })
  salePrice: number;

  @Column({ name: 'stock_actual', type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'stock_minimo', type: 'int', default: 0 })
  minStock: number;

  @Column({ name: 'estado_producto', type: 'varchar', length: 20, default: 'Activo' })
  status: string;

  @Column({ name: 'id_categoria' })
  categoryId: number;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  expirationDate: Date; 

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'id_categoria' })
  category: Category;
  
  @OneToMany(() => InventoryMovement, (mov) => mov.producto) 
  movimientos: InventoryMovement[];

  @Column({ name: 'id_usuario', nullable: true })
  id_usuario: number;
}