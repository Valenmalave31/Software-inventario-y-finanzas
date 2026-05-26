import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BudgetService } from '../budget/budget.service';
import { TargetsService } from '../target/targets.service';
import { AlertsService } from '../alerts/alerts.service';
import { Usuario } from '../auth/entities/usuario.entity';

type TransactionFilters = {
  from?: string;
  to?: string;
  typeId?: string;
  categoryId?: string;
};

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    private readonly budgetsService: BudgetService,
    private readonly targetsService: TargetsService,
    private readonly alertsService: AlertsService,  ) {}

  async create(dto: CreateTransactionDto, userId: number) {
    const transaction = this.transactionRepo.create({
      ...dto,
      userId,
    });
    
    const savedTransaction = await this.transactionRepo.save(transaction);
    const transaccionCompleta = await this.transactionRepo.findOne({
      where: { id: savedTransaction.id },
      relations: ['category'],
    });
    const usuarios = await this.usuarioRepo.find({
      select: ['id', 'nombre', 'correo'],
    });
    const amount = Number(dto.amount);

    if (Number(dto.typeId) === 1) { 
      await this.targetsService.updateProgress(userId, amount, 1, dto.date);
    } 
    else if (Number(dto.typeId) === 2) { 
      // Actualizar progreso en Metas
      await this.targetsService.updateProgress(userId, amount, 2, dto.date);

      // Incrementar presupuesto si aplica
      if (dto.budgetId) {
        await this.budgetsService.incrementUsedAmount(Number(dto.budgetId), amount);
      }

      // GENERAR ALERTA DE PAGO (EGRESO)
     const categoria = transaccionCompleta?.category?.name || "Pago";
      const mensaje = `${categoria} | ${dto.concept} - $${amount.toLocaleString()}`;

      try {
      await this.alertsService.generarAlertaPagoRealizado(userId, mensaje, savedTransaction.id);
      } catch (error) {
        console.error("❌ ERROR ALERTA PAGO:", error);
      }

    return savedTransaction;
  }}

  private buildTransactionsQuery(userId: number, filters: TransactionFilters = {}) {
    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.date', 'DESC');

    if (filters.from) {
      qb.andWhere('transaction.date >= :from', { from: filters.from });
    }

    if (filters.to) {
      qb.andWhere('transaction.date <= :to', { to: filters.to });
    }

    if (filters.typeId) {
      qb.andWhere('transaction.typeId = :typeId', { typeId: Number(filters.typeId) });
    }

    if (filters.categoryId) {
      qb.andWhere('transaction.categoryId = :categoryId', { categoryId: Number(filters.categoryId) });
    }

    return qb;
  }

  async findAll(userId: number, filters: TransactionFilters = {}) {
    const transactions = await this.buildTransactionsQuery(userId, filters).getMany();

    return transactions.map(t => ({
      ...t,
      typeName: Number(t.typeId) === 1 ? 'Ingreso' : 'Egreso',
      categoryName: t.category?.name || 'Sin categoría',
    }));
  }

  async getSummary(userId: number, filters: TransactionFilters = {}) {
    const transactions = await this.buildTransactionsQuery(userId, filters).getMany();

    const income = transactions
      .filter(t => Number(t.typeId) === 1)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expenses = transactions
      .filter(t => Number(t.typeId) === 2)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const netProfit = income - expenses;
    const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;
    const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;

    return {
      totalIncome: income,       
      totalExpenses: expenses,    
      utilidadNeta: netProfit,    
      profitMargin: Number(profitMargin.toFixed(2)), 
      expenseRatio: Number(expenseRatio.toFixed(2)), 
      balance: netProfit,
      cashFlow: netProfit,
      status: netProfit >= 0 ? 'Rentable' : 'Déficit'
    };
  }

  async getTimeSeries(userId: number, filters: TransactionFilters = {}) {
    const transactions = await this.buildTransactionsQuery(userId, filters).getMany();

    const dailyMap = new Map<string, { ingresos: number; costos: number }>();
    for (const transaction of transactions) {
      const date = String(transaction.date);
      const current = dailyMap.get(date) || { ingresos: 0, costos: 0 };

      if (Number(transaction.typeId) === 1) {
        current.ingresos += Number(transaction.amount || 0);
      } else if (Number(transaction.typeId) === 2) {
        current.costos += Number(transaction.amount || 0);
      }

      dailyMap.set(date, current);
    }

    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => {
        const parsed = new Date(`${date}T00:00:00`);
        const day = Number.isNaN(parsed.getTime())
          ? date
          : parsed.toLocaleDateString('es-CO', { weekday: 'short' });

        return {
          date,
          day,
          ingresos: values.ingresos,
          costos: values.costos,
          utilidad: values.ingresos - values.costos,
        };
      });
  }
}