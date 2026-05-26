import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Usuario } from '../../auth/entities/usuario.entity';

@Entity('movimiento_inventario')
export class InventoryMovement {
  @PrimaryGeneratedColumn()
  id_mov: number;

  @Column({ type: 'varchar', length: 50 })
  tipo_mov: string;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: Date;

  @Column({ type: 'text' })
  razon: string;

  @Column({ type: 'int' })
  stock_antes: number;

  @Column({ type: 'int' })
  stock_despues: number;

  @ManyToOne(() => Product, (product) => product.movimientos)
  @JoinColumn({ name: 'id_producto' })
  producto: Product;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ type: 'int', nullable: true })
  id_detalle: number;
}
