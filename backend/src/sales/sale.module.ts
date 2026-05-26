import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sales.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { SaleService } from './sales.service';
import { SaleController } from './sales.controller';
import { Product } from '../products/entities/product.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { SettingsModule } from '../settings/settings.module';
import { Setting } from '../settings/entities/settings.entity'; 
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleDetail,
      Product,
      Usuario,
      InventoryMovement,
      Setting, 
    ]),
    SettingsModule,
    TransactionsModule,
    AuthModule,
  ],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SalesModule {}
