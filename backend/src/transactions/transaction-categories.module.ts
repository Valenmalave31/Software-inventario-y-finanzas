import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionCategoriesService } from './transaction-categories.service';
import { TransactionCategoriesController } from './transaction-categories.controller';
import { TransactionCategory } from './entities/transaction-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionCategory])],
  controllers: [TransactionCategoriesController],
  providers: [TransactionCategoriesService],
  exports: [TransactionCategoriesService],
})
export class TransactionCategoriesModule {}