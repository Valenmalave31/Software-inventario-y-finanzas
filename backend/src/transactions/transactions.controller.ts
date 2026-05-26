import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() createTransactionDto: CreateTransactionDto, 
    @Request() req
  ) {
    return await this.transactionsService.create(createTransactionDto, req.user.id);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('typeId') typeId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return await this.transactionsService.findAll(req.user.id, { from, to, typeId, categoryId });
  }

  @Get('summary')
  async getDashboardSummary(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('typeId') typeId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return await this.transactionsService.getSummary(req.user.id, { from, to, typeId, categoryId });
  }

  @Get('timeseries')
  async getTimeSeries(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('typeId') typeId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return await this.transactionsService.getTimeSeries(req.user.id, { from, to, typeId, categoryId });
  }
}