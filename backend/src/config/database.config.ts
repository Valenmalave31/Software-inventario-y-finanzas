import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Usuario } from '../auth/entities/usuario.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { Sale } from '../sales/entities/sales.entity';
import { SaleDetail } from '../sales/entities/sale-detail.entity';
import { Budget } from '../budget/entities/budget.entity';
import { BudgetCategory } from '../budget/entities/budget-category.entity';
import { Target } from '../target/entities/target.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionCategory } from '../transactions/entities/transaction-category.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { Setting } from '../settings/entities/settings.entity'; 
import { Sesion } from '../auth/entities/sesion.entity'; 

export const databaseConfig = (): TypeOrmModuleOptions => {
  const entities = [
    Usuario,
    Sesion,
    Product,
    Category,
    InventoryMovement,
    Sale,
    SaleDetail,
    Budget,
    BudgetCategory,
    Target,
    Transaction,
    TransactionCategory,
    Alert,
    Setting,
  ];

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    if (databaseUrl.includes('://host') || databaseUrl.includes('@host') || /:\/\/host/.test(databaseUrl)) {
      throw new Error('Invalid DATABASE_URL: contains placeholder "host". Set DATABASE_URL to a valid Postgres connection string.');
    }

    return {
      type: 'postgres',
      url: databaseUrl,
      entities,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  const host = process.env.DB_HOST;
  if (!host) {
    throw new Error('Database configuration missing: set DATABASE_URL or DB_HOST/DB_* environment variables.');
  }

  return {
    type: 'postgres',
    host,
    port: parseInt(process.env.DB_PORT as string, 10) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities,
    synchronize: true,
    ssl: {
      rejectUnauthorized: false,
    },
  };
};
