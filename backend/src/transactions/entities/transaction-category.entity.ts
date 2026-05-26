import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'categoria_transaccion', synchronize: false })
export class TransactionCategory {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  id: number;

  @Column({ name: 'nombre' })
  name: string;

  @Column({ name: 'id_tipo_transaccion' })
  typeId: number;
}