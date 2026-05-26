import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { SaleDetail } from '../sales/entities/sale-detail.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { MailService } from '../auth/mail.service';

describe('ProductsService (writes)', () => {
  let service: ProductsService;
  const productRepo = { create: jest.fn(), save: jest.fn(), update: jest.fn(), findOne: jest.fn() };
  const movementRepo = { /* unused in these tests */ };
  const detailRepo = { /* unused */ };
  const alertRepo = { findOne: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const usuarioRepo = { find: jest.fn() };
  const mailService = { sendAlertEmailToAll: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(InventoryMovement), useValue: movementRepo },
        { provide: getRepositoryToken(SaleDetail), useValue: detailRepo },
        { provide: getRepositoryToken(Alert), useValue: alertRepo },
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepo },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('create() guarda producto y trata payload malicioso como dato', async () => {
    const malicious = "'; DROP TABLE users; --";
    const dto: any = { name: malicious, stock: 1, minStock: 5 };
    const userId = 10;

    productRepo.create.mockReturnValue(dto);
    productRepo.save.mockResolvedValue({ id: 123, ...dto });
    usuarioRepo.find.mockResolvedValue([{ id: 1, nombre: 'A', correo: 'a@a' }]);
    alertRepo.findOne.mockResolvedValue(null);
    alertRepo.save.mockResolvedValue({ id_alerta: 1 });

    const res = await service.create(dto, userId);

    expect(productRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: malicious, id_usuario: userId }));
    expect(productRepo.save).toHaveBeenCalled();
    // cuando stock < minStock debe crear alerta
    expect(alertRepo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 123);
  });

  it('update() actualiza y crea alerta si stock bajo', async () => {
    const dto: any = { name: 'Prueba', stock: 0, minStock: 5 };
    const userId = 5;
    const product = { id: 55, name: 'Prueba', stock: 0, minStock: 5 };

    productRepo.update.mockResolvedValue(undefined);
    // findOne debe devolver el producto actualizado
    (service as any).findOne = jest.fn().mockResolvedValue(product);
    alertRepo.findOne.mockResolvedValue(null);
    alertRepo.save.mockResolvedValue({ id_alerta: 2 });

    const res = await service.update(55, dto, userId);

    expect(productRepo.update).toHaveBeenCalledWith(55, expect.objectContaining({ id_usuario: userId }));
    expect(alertRepo.save).toHaveBeenCalled();
    expect(res).toEqual(product);
  });
});
