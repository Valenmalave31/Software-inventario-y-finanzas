import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from '../../../src/inventory/inventory.service';
import { InventoryMovement } from '../../../src/inventory/entities/inventory-movement.entity';
import { Product } from '../../../src/products/entities/product.entity';

describe('InventoryService (writes)', () => {
  let service: InventoryService;
  const movementRepo = { create: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn() };
  const productRepo = { findOne: jest.fn(), save: jest.fn() };
  const usuarioRepo = { find: jest.fn() };
  const mailService = { sendAlertEmailToAll: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(InventoryMovement), useValue: movementRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken('Usuario'), useValue: usuarioRepo },
        { provide: 'MailService', useValue: mailService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  it('createMovement() guarda movimiento y trata texto malicioso como dato', async () => {
    const malicious = "'; DROP TABLE users; --";
    const dto: any = { id_producto: 1, tipo_mov: 'Entrada', cantidad: 10, razon: malicious };
    const user = { id: 2, nombre: 'U' } as any;

    const product = { id: 1, stock: 0, minStock: 100, name: 'X' };
    productRepo.findOne.mockResolvedValue(product);

    movementRepo.create.mockReturnValue(dto);
    movementRepo.save.mockResolvedValue({ id: 5, ...dto });
    usuarioRepo.find.mockResolvedValue([{ id: 1, nombre: 'A', correo: 'a@a' }]);
    mailService.sendAlertEmailToAll.mockResolvedValue(undefined);

    const res = await service.createMovement(dto, user);

    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: dto.id_producto } });
    expect(movementRepo.create).toHaveBeenCalled();
    expect(movementRepo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 5);
  });
});
