import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SaleModal from '../src/components/common-components/SaleModal';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  default: apiMock,
}));

describe('SaleModal', () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/products') {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Cuaderno', salePrice: 2500, stock: 10 },
          ],
        });
      }

      if (url === '/settings') {
        return Promise.resolve({
          data: {
            impuesto: 0,
            metodosPago: [{ nombre: 'efectivo', activo: true }],
          },
        });
      }

      return Promise.resolve({ data: [] });
    });
  });

  it('no registra si no hay productos agregados', async () => {
    const onClose = vi.fn();
    render(<SaleModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /registrar venta/i }));

    expect(await screen.findByText(/Debes agregar al menos un producto/i)).toBeInTheDocument();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('agrega un producto y envía la venta', async () => {
    const onClose = vi.fn();
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });

    render(<SaleModal open={true} onClose={onClose} />);

    await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith('/products'));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /seleccionar producto/i }));
    fireEvent.click(await screen.findByRole('option', { name: /Cuaderno \(\$2500\)/i }));
    fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar/i }));

    fireEvent.click(screen.getByRole('button', { name: /registrar venta/i }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post).toHaveBeenCalledWith('/sales', expect.objectContaining({
      productos: [
        {
          id_producto: 1,
          cantidad: 2,
          precio_unitario: 2500,
        },
      ],
      descuento_total: 0,
      metodo_pago: 'efectivo',
    }));
    expect(onClose).toHaveBeenCalled();
  });
});
