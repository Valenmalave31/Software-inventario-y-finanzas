import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionCategory } from './entities/transaction-category.entity';
import { validateSqlIdentifier } from '../common/sanitization.util';

@Injectable()
export class TransactionCategoriesService {
  constructor(
    @InjectRepository(TransactionCategory)
    private readonly repository: Repository<TransactionCategory>,
  ) {}

  async findAll() {
    const columns: Array<{ column_name: string }> = await this.repository.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'categoria_transaccion'
      `,
    );

    const columnSet = new Set(columns.map((c) => c.column_name));
    const nameColumn = columnSet.has('nombre')
      ? 'nombre'
      : columnSet.has('nombre_categoria')
        ? 'nombre_categoria'
        : null;

    const typeColumn = columnSet.has('id_tipo_transaccion')
      ? 'id_tipo_transaccion'
      : columnSet.has('tipo')
        ? 'tipo'
        : null;

    if (!nameColumn || !typeColumn) {
      throw new InternalServerErrorException(
        'No se pudieron resolver las columnas de categoria_transaccion',
      );
    }

    // Validate identifiers against whitelist to prevent SQL injection
    const validatedNameColumn = validateSqlIdentifier(nameColumn, ['nombre', 'nombre_categoria']);
    const validatedTypeColumn = validateSqlIdentifier(typeColumn, ['id_tipo_transaccion', 'tipo']);

    const rows: Array<{ id: number; name: string; type_value: number | string }> =
      await this.repository.query(
        `
        SELECT id_categoria AS id, ${validatedNameColumn} AS name, ${validatedTypeColumn} AS type_value
        FROM categoria_transaccion
        ORDER BY id_categoria ASC
        `,
      );

    return rows.map((row) => {
      const parsedType = Number(row.type_value);
      const isNumericType = Number.isFinite(parsedType);
      const normalizedType = isNumericType
        ? parsedType === 1
          ? 'Ingreso'
          : 'Egreso'
        : String(row.type_value).toLowerCase().includes('ingr')
          ? 'Ingreso'
          : 'Egreso';

      return {
        id: Number(row.id),
        name: String(row.name ?? ''),
        type: normalizedType,
        typeId: isNumericType ? parsedType : normalizedType === 'Ingreso' ? 1 : 2,
      };
    });
  }
}