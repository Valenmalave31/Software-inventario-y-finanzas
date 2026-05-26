import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SaleService } from '../../../src/sales/sales.service';
import { Sale } from '../../../src/sales/entities/sales.entity';
import { SaleDetail } from '../../../src/sales/entities/sale-detail.entity';
import { Product } from '../../../src/products/entities/product.entity';
import { InventoryMovement } from '../../../src/inventory/entities/inventory-movement.entity';
import { Setting } from '../../../src/settings/entities/settings.entity';
import { Usuario } from '../../../src/auth/entities/usuario.entity';
import { MailService } from '../../../src/auth/mail.service';
import { TransactionsService } from '../../../src/transactions/transactions.service';

describe('SaleService (writes)', () => {
  let service: SaleService;
  const saleRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn() };
  const detailRepo = { create: jest.fn(), save: jest.fn() };
  const productRepo = { findOne: jest.fn(), save: jest.fn() };
  const inventoryMovementRepo = { create: jest.fn(), save: jest.fn() };
  const settingsRepo = { findOne: jest.fn() };
  const usuarioRepo = { find: jest.fn() };
  const mailService = { sendAlertEmailToAll: jest.fn() };
  const transactionsService = { create: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleService,
        { provide: getRepositoryToken(Sale), useValue: saleRepo },
        { provide: getRepositoryToken(SaleDetail), useValue: detailRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(InventoryMovement), useValue: inventoryMovementRepo },
        { provide: getRepositoryToken(Setting), useValue: settingsRepo },
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepo },
        { provide: MailService, useValue: mailService },
        { provide: TransactionsService, useValue: transactionsService },
      ],
    }).compile();

    service = module.get<SaleService>(SaleService);
    jest.clearAllMocks();
  });

  it('createSale() guarda venta y procesa detalles y movimientos', async () => {
    const user = { id: 1 } as any;
    const dto: any = { productos: [{ id_producto: 2, cantidad: 1, precio_unitario: 100 }], descuento_total: 0, metodo_pago: 'Efectivo' };

    saleRepo.create.mockReturnValue({});
    saleRepo.save.mockResolvedValue({ id: 999, total: 100 });
    usuarioRepo.find.mockResolvedValue([]);
    productRepo.findOne.mockResolvedValue({ id: 2, stock: 10, minStock: 0, name: 'P' });
    detailRepo.create.mockReturnValue({});
    detailRepo.save.mockResolvedValue({ id: 11 });
    inventoryMovementRepo.create.mockReturnValue({});
    inventoryMovementRepo.save.mockResolvedValue({ id: 22 });
    productRepo.save.mockResolvedValue({ id: 2, stock: 9 });
    transactionsService.create.mockResolvedValue({});

    const res = await service.createSale(dto, user);

    expect(saleRepo.save).toHaveBeenCalled();
    expect(detailRepo.save).toHaveBeenCalled();
    expect(inventoryMovementRepo.save).toHaveBeenCalled();
    expect(productRepo.save).toHaveBeenCalled();
    expect(transactionsService.create).toHaveBeenCalled();
    expect(res).toHaveProperty('success', true);
  });
});
