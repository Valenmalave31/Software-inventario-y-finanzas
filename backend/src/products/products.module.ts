import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { SaleDetail } from '../sales/entities/sale-detail.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { AuthModule } from '../auth/auth.module';
import { Usuario } from '../auth/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      InventoryMovement,
      SaleDetail,
      Alert,
      Usuario, 
    ]),
    AuthModule,
  ],
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService, CategoriesService, TypeOrmModule],
})
export class ProductsModule {}