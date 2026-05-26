import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TargetsService } from './targets.service';
import { Target } from '../target/entities/target.entity';

describe('TargetsService (writes)', () => {
  let service: TargetsService;
  const targetRepo = { create: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TargetsService,
        { provide: getRepositoryToken(Target), useValue: targetRepo },
      ],
    }).compile();

    service = module.get<TargetsService>(TargetsService);
    jest.clearAllMocks();
  });

  it('create() guarda meta con calculationType normalizado', async () => {
    const dto: any = { title: 'T', calculationType: 'sum_ventas' };
    const userId = 9;
    targetRepo.create.mockReturnValue({});
    targetRepo.save.mockResolvedValue({ id: 77, ...dto, userId });

    const res = await service.create(dto, userId);

    expect(targetRepo.create).toHaveBeenCalled();
    expect(targetRepo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 77);
  });
});
