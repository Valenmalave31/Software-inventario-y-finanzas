import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  ParseIntPipe, 
  Query, 
  UseGuards, 
  Req        
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findFiltered(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.productsService.findFiltered(search, status);
  }

  @Get('metrics')
  async getMetrics() {
    return this.productsService.getMetrics();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Get(':id/removal-impact')
  async getRemovalImpact(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getRemovalImpact(id);
  }

@UseGuards(JwtAuthGuard) 
@Post()
async create(@Body() dto: CreateProductDto, @Req() req: any) {
  return this.productsService.create(dto, req.user.id); 
}

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @Req() req: any,
  ) {
    return this.productsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
