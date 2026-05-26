import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ProductModal from '../src/components/common-components/ProductModal';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  default: apiMock,
}));

describe('ProductModal', () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
    apiMock.get.mockResolvedValue({ data: [{ id: 1, name: 'Papelería' }] });
  });

  it('no envía si faltan campos obligatorios', async () => {
    const onClose = vi.fn();
    render(<ProductModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar producto/i }));

    expect(await screen.findAllByText(/Este campo se debe llenar/i)).toHaveLength(6);
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('envía el producto y cierra el modal', async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    apiMock.post.mockResolvedValueOnce({ data: { id: 10 } });

    render(<ProductModal open={true} onClose={onClose} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText(/nombre del producto/i), { target: { value: 'Resma' } });

    fireEvent.mouseDown(screen.getByLabelText(/categoría/i));
    fireEvent.click(await screen.findByText('Papelería'));

    fireEvent.change(screen.getByLabelText(/precio compra/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/precio venta/i), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/stock inicial/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/stock mínimo/i), { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar producto/i }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post).toHaveBeenCalledWith('/products', expect.objectContaining({
      name: 'Resma',
      categoryId: 1,
      purchasePrice: 1000,
      salePrice: 1500,
      stock: 20,
      minStock: 5,
      status: 'Activo',
    }));
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
