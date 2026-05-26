import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from '../budget/entities/budget.entity';
import { BudgetCategory } from '../budget/entities/budget-category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Sale } from '../sales/entities/sales.entity';
import { Target } from '../target/entities/target.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetCategory, Transaction, Sale, Target, Alert, Product, InventoryMovement])],
  controllers: [PlanningController],
  providers: [PlanningService],
})
export class PlanningModule {}