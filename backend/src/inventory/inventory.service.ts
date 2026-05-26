import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { Usuario } from '../auth/entities/usuario.entity';
import { MailService } from '../auth/mail.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryMovement)
    private movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    private mailService: MailService,
  ) {}

  async createMovement(dto: CreateInventoryMovementDto, user: Usuario) {
    const product = await this.productRepo.findOne({ where: { id: dto.id_producto } });
    if (!product) throw new Error('Producto no encontrado');

    const stockAntes = product.stock || 0;
    let stockDespues = stockAntes;

    if (dto.tipo_mov === 'Entrada') {
      stockDespues = stockAntes + dto.cantidad;
    } else {
      if (stockAntes < dto.cantidad) throw new Error('Stock insuficiente');
      stockDespues = stockAntes - dto.cantidad;
    }

    const movimiento = this.movementRepo.create({
      tipo_mov: dto.tipo_mov,
      cantidad: dto.cantidad,
      fecha: new Date(),
      razon: dto.razon,
      stock_antes: stockAntes,
      stock_despues: stockDespues,
      producto: product,
      usuario: user,
    });

    const movimientoGuardado = await this.movementRepo.save(movimiento);

    // Enviar alerta de bajo stock si aplica
    const minStock = Number(product.minStock) || 0;
    if (stockDespues <= minStock) {
      try {
        const usuarios = await this.usuarioRepo.find({
          select: ['id', 'nombre', 'correo'],
        });

        if (usuarios.length > 0) {
          await this.mailService.sendAlertEmailToAll(usuarios, {
            tipo_alerta: 'bajo_stock',
            fecha: new Date().toLocaleDateString('es-ES'),
            hora: new Date().toLocaleTimeString('es-ES'),
            detalle: `Producto: ${product.name} - Stock actual: ${stockDespues} unidades - Mínimo requerido: ${minStock}`,
            detalle_link: 'http://localhost:5173/inventario',
          });
        }
      } catch (error) {
        console.error('Error al enviar alerta de bajo stock:', error);
      }
    }

    return movimientoGuardado;
  }

  async findAll(filters: { search?: string; from?: string; to?: string; status?: string }) {
    const qb = this.movementRepo.createQueryBuilder('mov')
      .leftJoinAndSelect('mov.producto', 'producto')
      .leftJoinAndSelect('mov.usuario', 'usuario')
      .orderBy('mov.fecha', 'DESC');

    if (filters.search) {
      qb.andWhere('producto.name LIKE :search OR usuario.nombre LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters.from) {
      qb.andWhere('mov.fecha >= :from', { from: filters.from });
    }

    if (filters.to) {
      qb.andWhere('mov.fecha <= :to', { to: filters.to });
    }

    if (filters.status) {
      qb.andWhere('mov.tipo_mov = :status', { status: filters.status });
    }

    return qb.getMany();
  }
}
