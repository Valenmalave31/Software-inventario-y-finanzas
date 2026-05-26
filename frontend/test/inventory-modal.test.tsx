import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import InventoryModal from '../src/components/common-components/InventoryModal';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  default: apiMock,
}));

describe('InventoryModal', () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
    apiMock.get.mockResolvedValue({ data: [{ id: 3, name: 'Lápices' }] });
  });

  it('no envía si faltan campos', async () => {
    const onClose = vi.fn();
    render(<InventoryModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findAllByText(/Este campo se debe llenar/i)).toHaveLength(3);
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('envía el movimiento y cierra el modal', async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    apiMock.post.mockResolvedValueOnce({ data: { id: 22 } });

    render(<InventoryModal open={true} onClose={onClose} onSaved={onSaved} />);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /^Producto$/i }));
    fireEvent.click(await screen.findByRole('option', { name: 'Lápices' }));
    fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/razón/i), { target: { value: 'Ingreso inicial' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post).toHaveBeenCalledWith('/inventory/movements', expect.objectContaining({
      tipo_mov: 'Entrada',
      cantidad: 15,
      razon: 'Ingreso inicial',
      id_producto: 3,
    }));
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
