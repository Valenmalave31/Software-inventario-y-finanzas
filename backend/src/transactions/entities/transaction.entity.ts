import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity';
import { Budget } from '../../budget/entities/budget.entity';
import { TransactionCategory } from './transaction-category.entity';

@Entity({ name: 'transaccion' })
export class Transaction {
  @PrimaryGeneratedColumn({ name: 'id_transaccion' })
  id: number;

  @Column({ name: 'concepto' })
  concept: string;

  @Column({ name: 'monto', type: 'bigint' })
  amount: number;

  @Column({ name: 'fecha', type: 'date' })
  date: string;

  @Column({ name: 'id_tipo_transaccion' })
  typeId: number; 

  @Column({ name: 'id_categoria' })
  categoryId: number;

  @Column({ name: 'id_usuario' })
  userId: number;

  @Column({ name: 'id_presupuesto', nullable: true })
  budgetId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  user: Usuario;

  @ManyToOne(() => Budget, { nullable: true })
  @JoinColumn({ name: 'id_presupuesto' })
  budget: Budget;

  @ManyToOne(() => TransactionCategory)
  @JoinColumn({ name: 'id_categoria' })
  category: TransactionCategory;
}