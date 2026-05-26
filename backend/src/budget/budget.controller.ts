import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseIntPipe, 
  Req, 
  UseGuards 
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { FilterBudgetDto } from './dto/filter-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBudgetDto: CreateBudgetDto, @Req() req) {
    return this.budgetService.create(createBudgetDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() filterDto: FilterBudgetDto, @Req() req) {
    return this.budgetService.findAll(filterDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.budgetService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req
  ) {
    return this.budgetService.update(id, updateBudgetDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.budgetService.remove(id, req.user);
  }
}
