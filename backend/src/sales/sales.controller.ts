import { Controller, Post, Body, Req, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SaleService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { FilterSaleDto } from './dto/filter-sale.dto';
import { Usuario } from '../auth/entities/usuario.entity';

@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateSaleDto, @Req() req: any) {
    const user = req.user as Usuario;
    return this.saleService.createSale(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async summary(@Query() filterDto: FilterSaleDto) {
    return this.saleService.getSummary(filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('timeseries')
  async timeseries(@Query() filterDto: FilterSaleDto) {
    return this.saleService.getTimeSeries(filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payment-summary')
  async paymentSummary(@Query() filterDto: FilterSaleDto) {
    return this.saleService.getPaymentSummary(filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() filterDto: FilterSaleDto) {
    return this.saleService.findAll(filterDto);
  }
}
