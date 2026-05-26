import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BudgetService } from './budget.service';
import { Budget } from './entities/budget.entity';
import { BudgetCategory } from './entities/budget-category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

describe('BudgetService (writes)', () => {
  let service: BudgetService;
  const budgetRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), findOneBy: jest.fn() };
  const categoryRepo = { findOne: jest.fn() };
  const transactionRepo = { findBy: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: getRepositoryToken(Budget), useValue: budgetRepo },
        { provide: getRepositoryToken(BudgetCategory), useValue: categoryRepo },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    jest.clearAllMocks();
  });

  it('create() crea presupuesto cuando la categoría existe y no hay conflicto', async () => {
    const dto: any = { category_id: 1, month: 1, year: 2026, allocated_amount: 1000 };
    const user = { id: 7 } as any;

    categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'Cat' });
    budgetRepo.findOne.mockResolvedValue(null);
    budgetRepo.create.mockReturnValue(dto);
    budgetRepo.save.mockResolvedValue({ id: 50, ...dto });

    const res = await service.create(dto, user);

    expect(categoryRepo.findOne).toHaveBeenCalled();
    expect(budgetRepo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 50);
  });

  it('incrementUsedAmount() actualiza used_amount y guarda', async () => {
    const budget = { id: 5, used_amount: 100 };
    budgetRepo.findOneBy.mockResolvedValue(budget);
    budgetRepo.save.mockResolvedValue({ ...budget, used_amount: 150 });

    const res = await service.incrementUsedAmount(5, 50);

    expect(budgetRepo.findOneBy).toHaveBeenCalledWith({ id: 5 });
    expect(budgetRepo.save).toHaveBeenCalled();
    expect(res.used_amount).toBe(150);
  });
});
