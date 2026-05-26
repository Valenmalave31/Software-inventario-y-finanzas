import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { Alert } from './entities/alert.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Target } from '../target/entities/target.entity';
import { MailService } from '../auth/mail.service';
import { Sale } from '../sales/entities/sales.entity';
import { Product } from '../products/entities/product.entity'; 
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Alert,
      Transaction,
      Target,
      Sale,
      Product
    ]),
    SettingsModule,
  ],
  
  controllers: [AlertsController],
  providers: [AlertsService, MailService],
  exports: [AlertsService],
})

export class AlertsModule {}