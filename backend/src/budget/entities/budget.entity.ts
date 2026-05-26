import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity';
import { BudgetCategory } from './budget-category.entity';

@Entity({ name: 'presupuesto', synchronize: false })
export class Budget {
  @PrimaryGeneratedColumn({ name: 'id_presup' })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 150, nullable: true })
  name: string;

  @Column({ name: 'monto_asignado', type: 'bigint' })
  allocated_amount: number;

  @Column({ name: 'monto_utilizado', type: 'bigint', default: 0 })
  used_amount: number;

  @Column({ name: 'mes' })
  month: number;

  @Column({ name: 'ano' })
  year: number;

  @Column({ name: 'id_cat_presup' })
  category_id: number;

  @ManyToOne(() => BudgetCategory, { eager: true })
  @JoinColumn({ name: 'id_cat_presup' })
  category: BudgetCategory;

  @Column({ name: 'id_usuario' })
  id_usuario: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}