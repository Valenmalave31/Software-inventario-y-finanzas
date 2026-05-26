import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sale.module'; 
import { BudgetModule } from './budget/budget.module';
import { TargetsModule } from './target/targets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransactionCategoriesModule } from './transactions/transaction-categories.module';
import { AlertsModule } from './alerts/alerts.module';
import { SettingsModule } from './settings/settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PlanningModule } from './planning/planning.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => databaseConfig(),
    }),
    AuthModule,
    ProductsModule,
    InventoryModule,
    SalesModule, 
    BudgetModule,
    TargetsModule,
    TransactionsModule,
    TransactionCategoriesModule,
    AlertsModule,
    SettingsModule,
    DashboardModule,
    PlanningModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
