import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { BudgetModule } from '../budget/budget.module';
import { TargetsModule } from '../target/targets.module';
import { Alert } from '../alerts/entities/alert.entity';
import { AlertsModule } from '../alerts/alerts.module';
import { Usuario } from '../auth/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Alert, Usuario]),
    BudgetModule,
    TargetsModule,
    AlertsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}