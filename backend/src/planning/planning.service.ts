import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../budget/entities/budget.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Target } from '../target/entities/target.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { Sale } from '../sales/entities/sales.entity';

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(Budget) private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Target) private readonly targetRepository: Repository<Target>,
    @InjectRepository(Alert) private readonly alertRepository: Repository<Alert>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(InventoryMovement) private readonly inventoryMovementRepository: Repository<InventoryMovement>,
    @InjectRepository(Sale) private readonly saleRepository: Repository<Sale>,
  ) {}

  private toNumber(value: unknown) {
    return Number(value) || 0;
  }

  private async getMappedBudgets() {
    const budgets = await this.budgetRepository.find({ relations: ['category'] });

    return Promise.all(
      budgets.map(async (budget) => {
        const transactions = await this.transactionRepository.find({
          where: { budgetId: budget.id, typeId: 2 },
        });

        const spent = transactions.reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);
        const total = this.toNumber(budget.allocated_amount);
        const percent = total > 0 ? Math.round((spent / total) * 100) : 0;

        return {
          id: budget.id,
          // Prefer the explicit budget name; fall back to category name
          name: budget.name || budget.category?.name || 'Sin nombre',
          category: budget.category?.name || 'Sin categoría',
          allocated_amount: total,
          used_amount: spent,
          percent,
          color: budget.category?.color || '#3b82f6',
          exceeded: spent > total ? spent - total : 0,
        };
      }),
    );
  }

  async getOverview() {
    const [mappedBudgets, targets] = await Promise.all([
      this.getMappedBudgets(),
      this.targetRepository.find({ order: { startDate: 'DESC' } }),
    ]);

    const mappedTargets = targets.map((target) => ({
      id: target.id,
      name: target.name,
      targetAmount: this.toNumber(target.targetAmount),
      currentAmount: this.toNumber(target.currentAmount),
      startDate: String(target.startDate),
      endDate: String(target.endDate),
      status: target.status || 'En progreso',
    }));

    const totalBudget = mappedBudgets.reduce((sum, budget) => sum + this.toNumber(budget.allocated_amount), 0);
    const totalSpent = mappedBudgets.reduce((sum, budget) => sum + this.toNumber(budget.used_amount), 0);
    const usage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const activeGoals = mappedTargets.filter((target) => String(target.status || '').toLowerCase() !== 'completada').length;

    return {
      budgets: mappedBudgets,
      targets: mappedTargets,
      totals: {
        totalBudget,
        totalSpent,
        available: totalBudget - totalSpent,
        usage,
        activeGoals,
      },
    };
  }

  async getAccountingOverview() {
    const [budgets, transactions] = await Promise.all([
      this.getMappedBudgets(),
      this.transactionRepository.find({ relations: ['category'], order: { date: 'DESC' } }),
    ]);

    const mappedTransactions = transactions.map((transaction) => ({
      ...transaction,
      typeName: Number(transaction.typeId) === 1 ? 'Ingreso' : 'Egreso',
      categoryName: transaction.category?.name || 'Sin categoría',
    }));

    const totalIncome = mappedTransactions
      .filter((transaction) => Number(transaction.typeId) === 1)
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);

    const totalExpenses = mappedTransactions
      .filter((transaction) => Number(transaction.typeId) === 2)
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);

    const balance = totalIncome - totalExpenses;

    return {
      budgets,
      transactions: mappedTransactions,
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        cashFlow: balance,
      },
    };
  }

  async getAlertsOverview() {
    return this.alertRepository.find({
      order: { fecha: 'DESC' },
    });
  }

  async getInventoryOverview() {
    const [products, movements, alerts] = await Promise.all([
      this.productRepository.find({ relations: ['category'] }),
      this.inventoryMovementRepository.find({ relations: ['producto'], order: { fecha: 'DESC' } }),
      this.alertRepository.find({ order: { fecha: 'DESC' } }),
    ]);

    return {
      products,
      movements,
      alerts,
    };
  }

  private parseApiDate(value: unknown): Date | null {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  async getAccountingReportOverview(filters: { from?: string; to?: string }) {
    const fromDate = this.parseApiDate(filters.from);
    const toDate = this.parseApiDate(filters.to);

    const [sales, transactions] = await Promise.all([
      this.saleRepository.find({ relations: ['details', 'details.product'] }),
      this.transactionRepository.find({ relations: ['category'] }),
    ]);

    const filteredSales = sales.filter((sale) => {
      const saleDate = this.parseApiDate(sale.date);
      if (!saleDate) return false;
      if (fromDate && saleDate < fromDate) return false;
      if (toDate && saleDate > toDate) return false;
      return true;
    });

    const filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = this.parseApiDate(transaction.date);
      if (!transactionDate) return false;
      if (fromDate && transactionDate < fromDate) return false;
      if (toDate && transactionDate > toDate) return false;
      return true;
    });

    const totalIncome = filteredTransactions
      .filter((transaction) => Number(transaction.typeId) === 1)
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);

    const totalExpenses = filteredTransactions
      .filter((transaction) => Number(transaction.typeId) === 2)
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);

    const utilidadNeta = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (utilidadNeta / totalIncome) * 100 : 0;

    const seriesMap = new Map<string, { ingresos: number; costos: number; utilidad: number }>();
    for (const sale of filteredSales) {
      const key = String(sale.date);
      const current = seriesMap.get(key) || { ingresos: 0, costos: 0, utilidad: 0 };
      const saleTotal = this.toNumber(sale.total);
      current.ingresos += saleTotal;
      current.utilidad += saleTotal;
      seriesMap.set(key, current);
    }

    for (const transaction of filteredTransactions) {
      const key = String(transaction.date);
      const current = seriesMap.get(key) || { ingresos: 0, costos: 0, utilidad: 0 };
      const amount = this.toNumber(transaction.amount);
      if (Number(transaction.typeId) === 1) {
        current.ingresos += amount;
        current.utilidad += amount;
      } else if (Number(transaction.typeId) === 2) {
        current.costos += amount;
        current.utilidad -= amount;
      }
      seriesMap.set(key, current);
    }

    const series = Array.from(seriesMap.entries())
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
          utilidad: values.utilidad,
        };
      });

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + this.toNumber(sale.total), 0);
    const totalSalesCount = filteredSales.length;

    const paymentMap = new Map<string, { count: number; amount: number }>();
    for (const sale of filteredSales) {
      const method = sale.paymentMethod || 'Sin definir';
      const current = paymentMap.get(method) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += this.toNumber(sale.total);
      paymentMap.set(method, current);
    }

    const methods = Array.from(paymentMap.entries())
      .map(([method, values]) => ({ method, count: values.count, amount: values.amount }))
      .sort((a, b) => b.count - a.count || b.amount - a.amount);

    return {
      summary: {
        totalIncome,
        totalExpenses,
        utilidadNeta,
        profitMargin: Number(profitMargin.toFixed(2)),
      },
      series,
      salesSummary: {
        totalRevenue,
        totalSalesCount,
      },
      paymentSummary: {
        preferredMethod: methods[0]?.method || 'Sin datos',
      },
    };
  }

  async markAllAlertsAsRead() {
    return this.alertRepository.update({ leida: false }, { leida: true });
  }

  async markAlertAsRead(id: number) {
    const alert = await this.alertRepository.findOne({ where: { id_alerta: id } });
    if (!alert) {
      throw new NotFoundException('Alerta no encontrada');
    }

    alert.leida = true;
    return this.alertRepository.save(alert);
  }

  async deleteAllAlerts() {
    return this.alertRepository.delete({});
  }

  async deleteReadAlerts() {
    return this.alertRepository.delete({ leida: true });
  }

  async deleteUnreadAlerts() {
    return this.alertRepository.delete({ leida: false });
  }

  async deleteAlert(id: number) {
    const result = await this.alertRepository.delete({ id_alerta: id });
    if (!result.affected) {
      throw new NotFoundException('Alerta no encontrada');
    }

    return { mensaje: 'Alerta eliminada correctamente' };
  }

}