import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('categoria')
export class Category {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  id: number;

  @Column({ name: 'nombre_categoria', type: 'varchar', length: 100 })
  name: string;
}
