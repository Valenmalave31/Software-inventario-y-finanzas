import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { Budget } from './entities/budget.entity';
import { BudgetCategory } from './entities/budget-category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Budget, 
      BudgetCategory,
      Transaction
    ])
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService, TypeOrmModule]
})
export class BudgetModule {}