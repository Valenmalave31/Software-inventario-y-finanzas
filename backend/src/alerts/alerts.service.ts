import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Target } from '../target/entities/target.entity';
import { Sale } from '../sales/entities/sales.entity';
import { Product } from '../products/entities/product.entity';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../auth/mail.service';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,

    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    @InjectRepository(Target)
    private readonly targetRepository: Repository<Target>,

    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    private readonly mailService: MailService,

    private readonly settingsService: SettingsService,
    
  ) {}

  private async dispararEmailSiProcede(userId: number, mensaje: string, tipo: string) {
      try {
        console.log(`🔍 Intentando disparar email para usuario ${userId}. Tipo: ${tipo}`);
        const config = await this.settingsService.findOneByUser({ id: userId } as any);
        
        if (config && config.enviarEmailAlertas) {
          const correoDestino = config.usuario?.correo; 
          console.log(`📧 Configuración de email activa. Destinatario: ${correoDestino}`);

          if (correoDestino) {
            const result = await this.mailService.sendAlertEmail(correoDestino, {
              nombre: config.usuario?.nombre || "Usuario",
              tipo_alerta: tipo,
              fecha: new Date().toLocaleDateString('es-ES'),
              hora: new Date().toLocaleTimeString('es-ES'),
              detalle: mensaje,
              detalle_link: 'http://localhost:5173',
            });

            if (result) {
              console.log(`✅ SendGrid aceptó el mensaje para: ${correoDestino}`);
            } else {
              console.error(`❌ SendGrid rechazó el envío. Revisa tu .env y el remitente.`);
            }
          } else {
            console.warn(`⚠️ El usuario ${userId} no tiene un correo electrónico registrado.`);
          }
        } else {
          console.log(`ℹ️ El usuario ${userId} tiene desactivados los correos en Configuración.`);
        }
      } 
      
      catch (error) {
        console.error('❌ Error grave en el flujo de email:', error);
      }
    }

  private async isNotificationEnabled(userId: number, titulo: string): Promise<boolean> {
  const config = await this.settingsService.findOneByUser({ id: userId } as any);
  
  if (!config || !config.notificacionesConfig) {
        console.log(`⚠️ Usuario ${userId} no tiene tabla de configuraciones creada.`);
        return false; 
  }

  const pref = config.notificacionesConfig.find(
        n => n.titulo.trim().toLowerCase() === titulo.trim().toLowerCase()
    );

  if (pref) {
        console.log(`🔔 Preferencia [${titulo}]: ${pref.activo ? 'ACTIVADA' : 'DESACTIVADA'}`);
        return pref.activo;
    }

  console.log(`❓ No se encontró la opción "${titulo}" en la lista de notificaciones del usuario.`);
      return false; 
  }

  async generarAlertasVencimientoEgresos(userId: number) {
    if (!(await this.isNotificationEnabled(userId, 'Pagos pendientes'))) return;

    const hoy = new Date();
    const tresDiasDespues = new Date();
    tresDiasDespues.setDate(hoy.getDate() + 3);

    const hoyStr = hoy.toISOString().split('T')[0];
    const limiteStr = tresDiasDespues.toISOString().split('T')[0];

    const egresosProximos = await this.transactionRepo.find({
      where: {
        userId: userId,
        typeId: 2,
        date: Between(hoyStr, limiteStr)
      },
      relations: ['category']
    });

    for (const egreso of egresosProximos) {
      const mensaje = `Recordatorio: Pago de ${egreso.category?.name || 'Egreso'} (${egreso.concept}) vence el ${egreso.date}`;

      const alertaExistente = await this.alertRepository.findOne({
        where: {
          mensaje: mensaje,
          id_usuario: userId
        }
      });

      if (!alertaExistente) {
        await this.alertRepository.save({
          tipo: 'Vencimiento',
          mensaje: mensaje,
          leida: false,
          id_usuario: userId,
        });

        await this.dispararEmailSiProcede(userId, mensaje, 'Vencimiento Próximo');
      }
    }
  }

  async verificarMetas(userId: number) {
    if (!(await this.isNotificationEnabled(userId, 'Metas alcanzadas'))) return;

    const metas = await this.targetRepository.find({
      where: { userId: userId },
    });

    for (const meta of metas) {
      const alcanzada = Number(meta.currentAmount) >= Number(meta.targetAmount);
      if (alcanzada) {
        const mensajeMeta = `¡Objetivo Logrado! Has alcanzado la meta: ${meta.name}`;

        const existe = await this.alertRepository.findOne({
          where: { mensaje: mensajeMeta, id_usuario: userId }
        });

        if (!existe) {
          await this.alertRepository.save({
            tipo: 'Metas',
            mensaje: mensajeMeta,
            leida: false,
            id_usuario: userId,
          });
        }
      }
    }
  }

  async generarResumenDiario(userId: number) {
    if (!(await this.isNotificationEnabled(userId, 'Resumen diario'))) return;

    const hoyStr = new Date().toISOString().split('T')[0];
    const ventasHoy = await this.saleRepository.find({
      where: {
        user: { id: userId },
      },
    });

    if (ventasHoy.length > 0) {
      const totalVendido = ventasHoy.reduce((sum, sale) => sum + Number(sale.total), 0);
      const mensajeResumen = `Resumen de hoy: ${ventasHoy.length} ventas por total de $${totalVendido.toLocaleString()}`;
      const existe = await this.alertRepository.findOne({
        where: { mensaje: mensajeResumen, id_usuario: userId }
      });

      if (!existe) {
        await this.alertRepository.save({
          tipo: 'Resumen',
          mensaje: mensajeResumen,
          leida: false,
          id_usuario: userId,
        });
      }
    }
  }

  async verificarStockBajo(userId: number) {
  console.log(`--- 📦 INICIO PROCESO STOCK (Usuario: ${userId}) ---`);
  const isEnabled = await this.isNotificationEnabled(userId, 'Stock bajo');
  
  if (!isEnabled) {
    console.log(`🚫 [BLOQUEO] Notificación desactivada en preferencias.`);
    return;
  }

  const productosBajos = await this.productRepository
    .createQueryBuilder('p')
    .where('p.id_usuario = :userId', { userId })
    .andWhere('p.stock_actual <= p.stock_minimo')
    .getMany();

  console.log(`📊 [QUERY] Productos bajo el mínimo: ${productosBajos.length}`);

  for (const producto of productosBajos) { 
    const alertaExistente = await this.alertRepository.findOne({
      where: { id_producto: producto.id, tipo: 'Stock', id_usuario: userId }
    });

    if (!alertaExistente) {
      console.log(`🆕 [NUEVA] No hay alerta previa para ${producto.name}. Procediendo a enviar email...`);
      const nuevaAlerta = await this.alertRepository.save({
        tipo: 'Stock',
        mensaje: `Stock bajo: ${producto.name} tiene solo ${producto.stock} unidades.`,
        id_usuario: userId,
        leida: false,
        id_producto: producto.id
      });
      await this.dispararEmailSiProcede(userId, nuevaAlerta.mensaje, 'Inventario Crítico');
    } else {
      console.log(`⚠️ [EMAIL OMITIDO] Ya existe una alerta en BD para el producto "${producto.name}" (ID: ${producto.id}). No se repetirá el correo para no saturar.`);
    }
  }
  console.log(`--- 🏁 FIN PROCESO STOCK ---`);
}

  async findAll(user: any) {
    const userId = user.id || user.sub || user.userId; 
    
    if (!userId) return [];

    try {
      await this.verificarStockBajo(userId); 
      
      await this.verificarMetas(userId);
      await this.generarResumenDiario(userId);
      await this.generarAlertasVencimientoEgresos(userId);
    } catch (error) {
      console.error("Error al generar alertas automáticas:", error);
    }

    return await this.alertRepository.find({
      where: { id_usuario: userId },
      order: { fecha: 'DESC' },
    });
  }

  // --- MÉTODOS DE GESTIÓN ---

  async markAsRead(id: number, userId: number) {
    const alert = await this.alertRepository.findOne({
      where: { id_alerta: id, id_usuario: userId },
    });

    if (!alert) throw new NotFoundException('Alerta no encontrada');
    alert.leida = true;
    return await this.alertRepository.save(alert);
  }

  async markAllAsRead(userId: number) {
    return await this.alertRepository.update(
      { id_usuario: userId, leida: false },
      { leida: true }
    );
  }

  async deleteOne(id: number, userId: number) {
    const alert = await this.alertRepository.findOne({
      where: { 
        id_alerta: id, 
        id_usuario: userId 
      },
    });

    if (!alert) {
      console.error(`❌ Alerta ${id} no encontrada para el usuario ${userId}`);
      throw new NotFoundException('Alerta no encontrada');
    }

    //Eliminación directa por ID
    return await this.alertRepository.delete(id);
  }

  async deleteAll(userId: number) {
    return await this.alertRepository.delete({ id_usuario: userId });
  }

  async deleteRead(userId: number) {
    return await this.alertRepository.delete({ id_usuario: userId, leida: true });
  }

  async deleteUnread(userId: number) {
    return await this.alertRepository.delete({ id_usuario: userId, leida: false });
  }

  async createAlert(data: any) {
    const nuevaAlerta = this.alertRepository.create(data);
    return await this.alertRepository.save(nuevaAlerta);
  }

async generarAlertaPagoRealizado(userId: number, mensaje: string, transactionId: number) {
  if (!(await this.isNotificationEnabled(userId, 'Pagos pendientes'))) return;

  const existeAlerta = await this.alertRepository.findOne({
    where: { id_transaccion: transactionId, id_usuario: userId }
  });

  if (!existeAlerta) {
    await this.alertRepository.save({
      tipo: 'Pagos',
      mensaje: mensaje,
      leida: false,
      id_usuario: userId,
      id_transaccion: transactionId,
    });

    await this.dispararEmailSiProcede(userId, mensaje, 'Pago Registrado');
    console.log(`✅ Alerta de pago creada y email enviado para transacción: ${transactionId}`);
  }
}
}