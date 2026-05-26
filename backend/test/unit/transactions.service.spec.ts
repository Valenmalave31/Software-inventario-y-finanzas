import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from '../../../src/transactions/transactions.service';
import { Transaction } from '../../../src/transactions/entities/transaction.entity';
import { Usuario } from '../../../src/auth/entities/usuario.entity';
import { BudgetService } from '../../../src/budget/budget.service';
import { TargetsService } from '../../../src/target/targets.service';
import { AlertsService } from '../../../src/alerts/alerts.service';

describe('TransactionsService (writes)', () => {
  let service: TransactionsService;
  const transactionRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn() };
  const usuarioRepo = { find: jest.fn() };
  const budgetsService = { incrementUsedAmount: jest.fn() };
  const targetsService = { updateProgress: jest.fn() };
  const alertsService = { generarAlertaPagoRealizado: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepo },
        { provide: BudgetService, useValue: budgetsService },
        { provide: TargetsService, useValue: targetsService },
        { provide: AlertsService, useValue: alertsService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  it('create() guarda transacción y llama a servicios relacionados', async () => {
    const dto: any = { concept: 'Pago', amount: 100, date: '2026-01-01', typeId: 2, categoryId: 1, budgetId: 7 };
    const userId = 42;

    transactionRepo.create.mockReturnValue(dto);
    transactionRepo.save.mockResolvedValue({ id: 123, ...dto });
    transactionRepo.findOne.mockResolvedValue({ id: 123, category: { name: 'Cat' } });
    usuarioRepo.find.mockResolvedValue([]);

    const res = await service.create(dto, userId);

    expect(transactionRepo.save).toHaveBeenCalled();
    expect(targetsService.updateProgress).toHaveBeenCalled();
    expect(budgetsService.incrementUsedAmount).toHaveBeenCalledWith(dto.budgetId, dto.amount);
    expect(alertsService.generarAlertaPagoRealizado).toHaveBeenCalled();
    expect(res).toBeDefined();
  });
});
