import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { SaleDetail } from '../sales/entities/sale-detail.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { MailService } from '../auth/mail.service';
import { Usuario } from '../auth/entities/usuario.entity';

type ProductRemovalImpact = {
  canDelete: boolean;
  action: 'delete' | 'deactivate';
  reasons: string[];
  hasSales: boolean;
  hasInventoryMovements: boolean;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    @InjectRepository(InventoryMovement)
    private inventoryMovementRepo: Repository<InventoryMovement>,

    @InjectRepository(SaleDetail)
    private saleDetailRepo: Repository<SaleDetail>,

    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,

    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,

    private mailService: MailService,
  ) {}

  async findAll() {
    return this.productRepo.find({ relations: ['category'] });
  }

  async findOne(id: number) {
    return this.productRepo.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async create(dto: CreateProductDto, userId: number) { 
    try {
      const product = this.productRepo.create({
        ...dto,             
        id_usuario: userId  
      });
      const savedProduct = await this.productRepo.save(product);
      const usuarios = await this.usuarioRepo.find({
        select: ['id', 'nombre', 'correo'],
      });

      const stock = Number(savedProduct.stock) || 0;
      const minStock = Number(savedProduct.minStock) || 0;

      // Lógica de alertas
      if (stock < minStock) {
        try {
          const existeAlerta = await this.alertRepository.findOne({
            where: {
              id_producto: savedProduct.id, 
              id_usuario: userId, 
              leida: false,
            },
          });

          if (!existeAlerta) {
            await this.alertRepository.save({
              tipo: 'Stock',
              mensaje: `Stock bajo: ${savedProduct.name}`,
              leida: false,
              id_producto: savedProduct.id,
              id_usuario: userId, 
            });
          }

          if (usuarios.length > 0) {
            await this.mailService.sendAlertEmailToAll(usuarios, {
              tipo_alerta: 'bajo_stock',
              fecha: new Date().toLocaleDateString('es-ES'),
              hora: new Date().toLocaleTimeString('es-ES'),
              detalle: `Producto: ${savedProduct.name} - Stock actual: ${stock} unidades - Mínimo requerido: ${minStock}`,
              detalle_link: 'http://localhost:5173/inventario',
            });
          }
        } catch (alertError) {
          console.error("Error al crear la alerta:", alertError);
        }
      }

      return savedProduct;
    } catch (error) {
      console.error("Error al crear producto:", error);
      throw error;
    }
  }

  // UPDATE SEGURO CON ALERTAS
async update(id: number, dto: UpdateProductDto, userId: number) {
  await this.productRepo.update(id, { ...dto, id_usuario: userId });

  const producto = await this.findOne(id);

  if (!producto) {
    return null;
  }

  const stock = Number(producto.stock) || 0;
  const minStock = Number(producto.minStock) || 0;

  if (stock <= minStock) {
    const existeAlerta = await this.alertRepository.findOne({
      where: {
        id_producto: producto.id,
        id_usuario: userId,
        tipo: 'Stock',
      },
    });

    if (!existeAlerta) {
      console.log(`📡 Stock bajo detectado en update para ${producto.name}. Creando alerta y enviando email...`);
      await this.alertRepository.save({
        tipo: 'Stock',
        mensaje: `Stock bajo: ${producto.name} tiene solo ${stock} unidades.`,
        leida: false,
        id_producto: producto.id,
        id_usuario: userId,
      });
     
    }
  } else {
    const resultado = await this.alertRepository.delete({
      id_producto: producto.id,
      tipo: 'Stock',
      id_usuario: userId
    });

    if (resultado && resultado.affected && resultado.affected > 0) {
      console.log(`✨ Sistema: Stock de "${producto.name}" repuesto. Alerta eliminada automáticamente.`);
    }
  }

  return producto;
}

  async remove(id: number) {
    const product = await this.findOne(id);

    if (!product) {
      return { message: 'Product not found' };
    }

    const impact = await this.getRemovalImpact(id);

    if (impact.action === 'deactivate') {
      product.status = 'Inactivo';
      await this.productRepo.save(product);

      return {
        action: 'deactivate',
        message: 'Producto inactivado porque tiene historial asociado.',
        reasons: impact.reasons,
      };
    } else {
      await this.productRepo.delete(id);

      return {
        action: 'delete',
        message: 'Producto eliminado de forma definitiva.',
        reasons: [],
      };
    }
  }

  async getRemovalImpact(productId: number): Promise<ProductRemovalImpact> {
    const [salesCount, inventoryCount] = await Promise.all([
      this.saleDetailRepo.count({
        where: { product: { id: productId } },
      }),
      this.inventoryMovementRepo.count({
        where: { producto: { id: productId } },
      }),
    ]);

    const hasSales = salesCount > 0;
    const hasInventoryMovements = inventoryCount > 0;

    const reasons: string[] = [];

    if (hasSales) {
      reasons.push('Tiene ventas registradas.');
    }

    if (hasInventoryMovements) {
      reasons.push('Tiene movimientos o registros de inventario asociados.');
    }

    const canDelete = !hasSales && !hasInventoryMovements;

    return {
      canDelete,
      action: canDelete ? 'delete' : 'deactivate',
      reasons,
      hasSales,
      hasInventoryMovements,
    };
  }

  async getMetrics() {
    const products = await this.findAll();

    const total = products.length;

    const activos = products.filter(p => p.status === 'Activo').length;

    const stockBajo = products.filter(p => {
      const stock = Number(p.stock) || 0;
      const minStock = Number(p.minStock) || 0;
      return stock < minStock;
    }).length;

    const valorInventario = products.reduce((sum, p) => {
      const precio = Number(p.purchasePrice) || 0;
      const stock = Number(p.stock) || 0;
      return sum + precio * stock;
    }, 0);

    return { total, activos, stockBajo, valorInventario };
  }

  async findFiltered(search?: string, status?: string) {
    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (status && status !== 'Todos') {
      query.andWhere('product.status = :status', { status });
    }

    return query.getMany();
  }
}