import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { FilterBudgetDto } from './dto/filter-budget.dto';
import { BudgetCategory } from './entities/budget-category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,

    @InjectRepository(BudgetCategory)
    private readonly categoryRepository: Repository<BudgetCategory>,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async create(createBudgetDto: CreateBudgetDto, user: any): Promise<Budget> {
    const { category_id, month, year } = createBudgetDto;

    const category = await this.categoryRepository.findOne({
      where: { id: category_id },
    });
    
    if (!category) {
      throw new BadRequestException(`La categoria con id ${category_id} no existe`);
    }

    const newBudget = this.budgetRepository.create({
      ...createBudgetDto,
      used_amount: 0, 
      id_usuario: user.id,
    });

    return await this.budgetRepository.save(newBudget);
  }

  async incrementUsedAmount(budgetId: number, amount: number) {
    const budget = await this.budgetRepository.findOneBy({ id: budgetId });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');

    budget.used_amount = Number(budget.used_amount) + Number(amount);
    return await this.budgetRepository.save(budget);
  }

  async findAll(filterDto: FilterBudgetDto, user: any) {
    const { month, year } = filterDto;

    const query = this.budgetRepository.createQueryBuilder('budget')
      .leftJoinAndSelect('budget.category', 'category')
      .where('budget.id_usuario = :userId', { userId: user.id });

    if (month) query.andWhere('budget.mes = :month', { month });
    if (year) query.andWhere('budget.ano = :year', { year });

    const budgets = await query.getMany();

    return await Promise.all(budgets.map(async (budget) => {
      // Calcular used_amount dinámicamente desde las transacciones
      const transactions = await this.transactionRepository.findBy({ 
        budgetId: budget.id,
        userId: user.id,
        typeId: 2, 
      });

      const spent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const total = parseFloat(budget.allocated_amount.toString());
      const percent = total > 0 ? Math.round((spent / total) * 100) : 0;

      return {
        id: budget.id,
        name: budget.category.name,
        allocated_amount: total,
        used_amount: spent,
        percent,
        color: budget.category.color,
        exceeded: spent > total ? spent - total : 0,
      };
    }));
  }

  async findOne(id: number, user: any): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id, id_usuario: user.id },
      relations: ['category'],
    });
    if (!budget) throw new NotFoundException(`Budget with ID ${id} not found`);
    return budget;
  }

  async update(id: number, updateBudgetDto: UpdateBudgetDto, user: any): Promise<Budget> {
    const budget = await this.findOne(id, user);
    const updatedBudget = Object.assign(budget, updateBudgetDto);
    return await this.budgetRepository.save(updatedBudget);
  }

  async remove(id: number, user: any): Promise<void> {
    const budget = await this.findOne(id, user);

    const movements = await this.transactionRepository.findBy({
      budgetId: budget.id,
      userId: user.id,
    });

    if (movements.length > 0 || Number(budget.used_amount || 0) > 0) {
      throw new ConflictException('No se puede eliminar un presupuesto con movimientos registrados; se debe ocultar en la vista');
    }

    await this.budgetRepository.remove(budget);
  }
}