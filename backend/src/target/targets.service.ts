import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Target } from '../target/entities/target.entity';
import { CreateTargetDto } from '../target/dto/create-target.dto';

@Injectable()
export class TargetsService {
  constructor(
    @InjectRepository(Target)
    private readonly targetRepository: Repository<Target>,
  ) {}

  private normalizeCalculationType(value: string): string {
    const normalized = String(value || '').trim().toUpperCase();

    if (normalized === 'SUM_VENTAS' || normalized.includes('VENTAS TOTALES')) return 'SUM_VENTAS';
    if (normalized === 'AVG_VENTAS' || normalized.includes('PROMEDIO')) return 'AVG_VENTAS';
    if (normalized === 'REDUCE_GASTOS' || normalized.includes('GASTOS')) return 'REDUCE_GASTOS';
    if (normalized === 'SUM_INGRESOS' || normalized.includes('INGRESOS')) return 'SUM_INGRESOS';

    return normalized;
  }

  async create(createTargetDto: CreateTargetDto, userId: number) {
    const newTarget = this.targetRepository.create({
      ...createTargetDto,
      userId: userId,
      currentAmount: 0,
      calculationType: String(createTargetDto.calculationType || '').trim().toUpperCase(),
      status: 'En progreso',
    });
    return await this.targetRepository.save(newTarget);
  }

  async findAll(userId: number) {
    return await this.targetRepository.find({
      where: { userId: userId },
      order: { startDate: 'DESC' },
    });
  }

  async remove(id: number, userId: number) {
    const target = await this.targetRepository.findOne({
      where: { id, userId },
    });

    if (!target) {
      throw new NotFoundException('Meta no encontrada');
    }

    if (Number(target.currentAmount || 0) > 0) {
      throw new ConflictException('No se puede eliminar una meta con progreso registrado');
    }

    await this.targetRepository.remove(target);

    return { mensaje: 'Meta eliminada correctamente' };
  }

  async updateProgress(
    userId: number,
    amount: number,
    transactionType: number,
    movementDate?: string,
  ) {
    const amountNumber = Number(amount || 0);
    if (amountNumber <= 0) return;

    const movement = movementDate ? new Date(`${movementDate}T00:00:00`) : new Date();

    const targets = await this.targetRepository
      .createQueryBuilder('target')
      .where('target.id_usuario = :userId', { userId })
      .andWhere('UPPER(TRIM(target.estado_meta)) = :status', { status: 'EN PROGRESO' })
      .orderBy('target.fecha_inicio', 'ASC')
      .getMany();

    for (const target of targets) {
      const normalizedType = this.normalizeCalculationType(target.calculationType);
      const isIncomeTarget = ['SUM_VENTAS', 'AVG_VENTAS', 'SUM_INGRESOS'].includes(normalizedType);
      const isExpenseTarget = normalizedType === 'REDUCE_GASTOS';

      if (Number(transactionType) === 1 && !isIncomeTarget) continue;
      if (Number(transactionType) === 2 && !isExpenseTarget) continue;

      const start = new Date(`${String(target.startDate).slice(0, 10)}T00:00:00`);
      const end = new Date(`${String(target.endDate).slice(0, 10)}T23:59:59`);

      if (movement < start || movement > end) continue;

      const current = Number(target.currentAmount || 0);
      const goal = Number(target.targetAmount || 0);
      const needed = goal - current;
      if (needed <= 0) continue;

      const contribution = Math.min(amountNumber, needed);
      target.currentAmount = current + contribution;

      if (target.currentAmount >= goal) {
        target.status = 'Completada';
      }

      await this.targetRepository.save(target);
    }
  }
}