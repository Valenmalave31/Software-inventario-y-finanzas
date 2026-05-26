import { Controller, Get, Post, Body, BadRequestException, Req, UseGuards, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { FilterInventoryMovementDto } from './dto/filter-inventory-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('movements')
  async findAll(@Query() filterDto: FilterInventoryMovementDto) {
    return await this.inventoryService.findAll(filterDto);
  }

  @UseGuards(JwtAuthGuard) 
  @Post('movements')
  async create(@Body() dto: CreateInventoryMovementDto, @Req() req: any) {
    try {
      return await this.inventoryService.createMovement(dto, req.user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
