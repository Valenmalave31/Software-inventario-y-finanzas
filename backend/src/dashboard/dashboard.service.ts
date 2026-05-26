import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sales.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Product } from '../products/entities/product.entity';
import { Alert } from '../alerts/entities/alert.entity';

const WEEK_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

const parseApiDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ymd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Alert) private readonly alertRepo: Repository<Alert>,
  ) {}

  private toNumber(value: unknown) {
    return Number(value) || 0;
  }

  async getOverview() {
    const [sales, transactions, products, alerts] = await Promise.all([
      this.saleRepo.find({ relations: ['details', 'details.product'] }),
      this.transactionRepo.find({ relations: ['category'] }),
      this.productRepo.find(),
      this.alertRepo.find({ order: { fecha: 'DESC' } }),
    ]);

    const now = new Date();
    const currentMonth = monthKey(now);
    const previousMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const salesMonth = sales
      .filter((sale) => {
        const date = parseApiDate(sale.date);
        return date ? monthKey(date) === currentMonth : false;
      })
      .reduce((sum, sale) => sum + this.toNumber(sale.total), 0);

    const salesPrevMonth = sales
      .filter((sale) => {
        const date = parseApiDate(sale.date);
        return date ? monthKey(date) === previousMonth : false;
      })
      .reduce((sum, sale) => sum + this.toNumber(sale.total), 0);

    const expensesMonth = transactions
      .filter((transaction) => {
        const date = parseApiDate(transaction.date);
        return date ? monthKey(date) === currentMonth && Number(transaction.typeId) === 2 : false;
      })
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);

    const expensesPrevMonth = transactions
      .filter((transaction) => {
        const date = parseApiDate(transaction.date);
        return date ? monthKey(date) === previousMonth && Number(transaction.typeId) === 2 : false;
      })
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);

    const productMetrics = {
      total: products.length,
      stockBajo: products.filter((product) => {
        const stock = Number(product.stock) || 0;
        const minStock = Number(product.minStock) || 0;
        return stock < minStock;
      }).length,
    };

    const salesByDay = new Map<string, number>();
    sales.forEach((sale) => {
      const date = parseApiDate(sale.date);
      if (!date) return;
      const key = ymd(date);
      salesByDay.set(key, (salesByDay.get(key) || 0) + this.toNumber(sale.total));
    });

    const weeklySales = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
      const key = ymd(date);
      return {
        day: WEEK_LABELS[date.getDay()],
        ventas: salesByDay.get(key) || 0,
      };
    });

    const sortedSales = [...sales].sort((a, b) => {
      const dateA = parseApiDate(a.date)?.getTime() || 0;
      const dateB = parseApiDate(b.date)?.getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;
      return Number(b.id || 0) - Number(a.id || 0);
    });

    const recentSales = sortedSales.slice(0, 10).map((sale) => {
      const quantity = Array.isArray(sale.details)
        ? sale.details.reduce((sum, detail) => sum + this.toNumber(detail.quantity), 0)
        : 0;

      const productName =
        Array.isArray(sale.details) && sale.details.length > 0
          ? sale.details[0]?.product?.name || 'Producto'
          : 'Sin detalle';

      const date = parseApiDate(sale.date);
      const timeText = date ? date.toLocaleDateString('es-CO') : '-';

      return {
        id: `V-${String(sale.id).padStart(3, '0')}`,
        producto: productName,
        cantidad: quantity,
        total: `$${Number(sale.total || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
        tiempo: timeText,
      };
    });

    const alertsData = alerts.slice(0, 4).map((alert) => ({
      id_alerta: alert.id_alerta,
      tipo: alert.tipo,
      mensaje: alert.mensaje,
      fecha: alert.fecha,
    }));

    return {
      sales,
      productMetrics,
      transactions,
      alerts: alertsData,
      computed: {
        metrics: [
          {
            value: `$${Number(salesMonth || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
            label: 'Ventas del Mes',
            change: salesPrevMonth === 0 ? (salesMonth > 0 ? '+100%' : '0%') : `${(((salesMonth - salesPrevMonth) / salesPrevMonth) * 100).toFixed(1)}%`,
          },
          {
            value: productMetrics.total.toLocaleString('es-CO'),
            label: 'Productos en Stock',
            change: `${productMetrics.stockBajo} con stock bajo`,
          },
          {
            value: `$${Number(expensesMonth || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
            label: 'Gastos Operativos',
            change: expensesPrevMonth === 0 ? (expensesMonth > 0 ? '+100%' : '0%') : `${(((expensesMonth - expensesPrevMonth) / expensesPrevMonth) * 100).toFixed(1)}%`,
          },
          {
            value: String(alerts.length),
            label: 'Alertas Activas',
            change: alerts.length > 0 ? `${alerts.length} críticas` : 'Sin alertas críticas',
          },
        ],
        weeklySales,
        recentSales,
      },
    };
  }
}