import { Controller, Get, UseGuards } from '@nestjs/common';
import { TransactionCategoriesService } from './transaction-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transaction-categories')
export class TransactionCategoriesController {
  constructor(private readonly service: TransactionCategoriesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}