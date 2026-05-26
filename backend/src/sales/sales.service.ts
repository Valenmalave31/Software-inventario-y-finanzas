import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sales.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Usuario } from '../auth/entities/usuario.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { TransactionsService } from '../transactions/transactions.service'; 
import { Setting } from '../settings/entities/settings.entity';
import { MailService } from '../auth/mail.service';

type SaleFilters = {
  search?: string;
  from?: string;
  to?: string;
  payment?: string;
};

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleDetail) private detailRepo: Repository<SaleDetail>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(InventoryMovement) private inventoryMovementRepo: Repository<InventoryMovement>,
    @InjectRepository(Setting) private settingsRepo: Repository<Setting>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    private readonly mailService: MailService,
    private readonly transactionsService: TransactionsService, 
  ) {}

  async createSale(dto: CreateSaleDto, user: Usuario) {
    const fechaColombia = new Date().toLocaleDateString('sv-SE', { 
      timeZone: 'America/Bogota' 
    });

    const config = await this.settingsRepo.findOne({ where: { usuario: { id: user.id } } });
    
    const tasaIva = config ? Number(config.impuesto) / 100 : 0;
    
    // 2. Calcular subtotal base (antes de impuestos y descuentos)
    const subtotalBase = dto.productos.reduce(
      (acc, p) => acc + (p.precio_unitario * p.cantidad),
      0,
    );

    //  Cálculos Dinámicos
    const valorIva = subtotalBase * tasaIva;
   
    const totalFinal = subtotalBase + valorIva - dto.descuento_total;

    const sale = this.saleRepo.create({
      date: fechaColombia, 
      subtotal: subtotalBase, 
      discount: dto.descuento_total,
      total: totalFinal, 
      paymentMethod: dto.metodo_pago,
      user,
    });

    const savedSale = await this.saleRepo.save(sale);
    const usuarios = await this.usuarioRepo.find({
      select: ['id', 'nombre', 'correo'],
    });

    // PROCESAR DETALLES Y STOCK 
    for (const p of dto.productos) {
      const product = await this.productRepo.findOne({
        where: { id: p.id_producto },
      });

      if (!product) {
        throw new Error(`Producto no encontrado con ID: ${p.id_producto}`);
      }

      const detail = this.detailRepo.create({
        quantity: p.cantidad,
        unitPrice: p.precio_unitario,
        subtotal: p.precio_unitario * p.cantidad,
        product,
        sale: savedSale,
      });

      const savedDetail = await this.detailRepo.save(detail);

      // Registrar movimiento de inventario
      const movimiento = this.inventoryMovementRepo.create({
        tipo_mov: 'Salida',
        cantidad: p.cantidad,
        fecha: new Date(), 
        razon: 'Venta Registrada',
        stock_antes: product.stock,
        stock_despues: product.stock - p.cantidad,
        producto: product,
        usuario: user,
        id_detalle: savedDetail.id,
      });

      await this.inventoryMovementRepo.save(movimiento);

      // Actualizar stock del producto
      product.stock = product.stock - p.cantidad;
      await this.productRepo.save(product);

      // Enviar alerta de bajo stock cuando el producto quede en mínimo o por debajo
      const minStock = Number(product.minStock) || 0;
      if (product.stock <= minStock && usuarios.length > 0) {
        try {
          await this.mailService.sendAlertEmailToAll(usuarios, {
            tipo_alerta: 'bajo_stock',
            fecha: new Date().toLocaleDateString('es-ES'),
            hora: new Date().toLocaleTimeString('es-ES'),
            detalle: `Producto: ${product.name} - Stock actual: ${product.stock} unidades - Mínimo requerido: ${minStock}`,
            detalle_link: 'http://localhost:5173/inventario',
          });
        } catch (mailError) {
          console.error('Error al enviar alerta de bajo stock desde ventas:', mailError);
        }
      }
    }

    // Registrar en el módulo de transacciones
    await this.transactionsService.create({
      concept: `Venta automática: Factura #${savedSale.id}`,
      amount: totalFinal,
      date: fechaColombia,
      typeId: 1, 
      categoryId: 1, 
      budgetId: undefined,
    }, user.id);

try {
      const ventaFinalizada = await this.saleRepo.findOne({
        where: { id: savedSale.id },
        relations: ['details'] 
      });

      return {
        success: true,
        id_venta: ventaFinalizada?.id,
        total: ventaFinalizada?.total,
        mensaje: 'Venta procesada correctamente'
      };
    } catch (error) {
      // Si falla el findOne final, al menos devolvemos el ID de lo que ya se guardó
      return { 
        success: true, 
        id_venta: savedSale.id, 
        mensaje: 'Venta guardada (error al recuperar detalle)' 
      };
    }
  }

  private buildSalesQuery(filters: SaleFilters) {
    const qb = this.saleRepo.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.details', 'details')
      .leftJoinAndSelect('details.product', 'product')
      .leftJoinAndSelect('sale.user', 'user')
      .orderBy('sale.date', 'DESC');

    if (filters.search) {
      qb.andWhere('(product.name ILIKE :search OR user.nombre ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.from) {
      qb.andWhere('sale.date >= :from', { from: filters.from });
    }

    if (filters.to) {
      qb.andWhere('sale.date <= :to', { to: filters.to });
    }

    if (filters.payment) {
      qb.andWhere('sale.paymentMethod = :payment', { payment: filters.payment });
    }

    return qb;
  }

  async findAll(filters: SaleFilters) {
    return this.buildSalesQuery(filters).getMany();
  }

  async getSummary(filters: SaleFilters) {
    const sales = await this.buildSalesQuery(filters).getMany();

    const totalRevenue = sales.reduce((acc, sale) => acc + (Number(sale.total) || 0), 0);
    const totalSalesCount = sales.length;
    const totalProductsSold = sales.reduce(
      (acc, sale) =>
        acc +
        (Array.isArray(sale.details)
          ? sale.details.reduce((sum, detail) => sum + (Number(detail.quantity) || 0), 0)
          : 0),
      0,
    );

    const productMap = new Map<string, number>();
    for (const sale of sales) {
      if (!Array.isArray(sale.details)) continue;
      for (const detail of sale.details) {
        const name = detail.product?.name || 'Producto';
        productMap.set(name, (productMap.get(name) || 0) + (Number(detail.quantity) || 0));
      }
    }

    const sortedProducts = Array.from(productMap.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const totalProducts = sortedProducts.length;
    const topCount = totalProducts > 6 ? 6 : Math.max(1, Math.floor(totalProducts / 2));
    const bottomCount = Math.min(6, Math.max(0, totalProducts - topCount));

    const topProducts = sortedProducts.slice(0, topCount);
    const topNames = new Set(topProducts.map((p) => p.name));

    const lowPriorityProducts = [...sortedProducts]
      .filter((p) => !topNames.has(p.name) && p.qty <= 2)
      .sort((a, b) => a.qty - b.qty || a.name.localeCompare(b.name));

    const remainingBottom = [...sortedProducts]
      .sort((a, b) => a.qty - b.qty)
      .filter((p) => !topNames.has(p.name))
      .filter((p) => p.qty > 2 || !lowPriorityProducts.some((lp) => lp.name === p.name));

    const distinctBottom = [...lowPriorityProducts, ...remainingBottom].slice(0, bottomCount);

    const bottomProducts =
      distinctBottom.length > 0
        ? distinctBottom
        : [...sortedProducts].sort((a, b) => a.qty - b.qty).slice(0, Math.min(6, totalProducts));

    return {
      totalRevenue,
      totalSalesCount,
      totalProductsSold,
      topProducts,
      bottomProducts,
    };
  }

  async getTimeSeries(filters: SaleFilters) {
    const sales = await this.buildSalesQuery(filters).getMany();

    const dayTotals = new Map<string, number>();
    for (const sale of sales) {
      const key = String(sale.date);
      dayTotals.set(key, (dayTotals.get(key) || 0) + (Number(sale.total) || 0));
    }

    return Array.from(dayTotals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => {
        const parsed = new Date(`${date}T00:00:00`);
        const dayName = Number.isNaN(parsed.getTime())
          ? date
          : parsed.toLocaleDateString('es-CO', { weekday: 'short' });

        return {
          date,
          name: dayName,
          total,
        };
      });
  }

  async getPaymentSummary(filters: SaleFilters) {
    const sales = await this.buildSalesQuery(filters).getMany();

    const paymentMap = new Map<string, { count: number; amount: number }>();
    for (const sale of sales) {
      const method = sale.paymentMethod || 'Sin definir';
      const current = paymentMap.get(method) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(sale.total || 0);
      paymentMap.set(method, current);
    }

    const methods = Array.from(paymentMap.entries())
      .map(([method, values]) => ({ method, count: values.count, amount: values.amount }))
      .sort((a, b) => b.count - a.count || b.amount - a.amount);

    return {
      preferredMethod: methods[0]?.method || 'Sin datos',
      methods,
      totalSales: sales.length,
    };
  }
}