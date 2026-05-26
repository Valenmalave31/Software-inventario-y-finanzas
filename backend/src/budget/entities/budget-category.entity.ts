import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Budget } from './budget.entity';

@Entity({ name: 'categoria_presupuesto', synchronize: false })
export class BudgetCategory {
  @PrimaryGeneratedColumn({ name: 'id_cat_presup' })
  id: number;

  @Column({ name: 'nombre', unique: true, nullable: true })
  name: string;

  @Column({ name: 'color_hex', default: '#1976d2' })
  color: string;

  @OneToMany(() => Budget, (budget) => budget.category)
  budgets: Budget[];
}