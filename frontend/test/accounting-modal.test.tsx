import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TransaccionModal from '../src/components/common-components/AccountingModal';

describe('AccountingModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('envía la transacción y cierra el modal', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 }),
    } as Response);

    render(
      <TransaccionModal
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
        categories={[
          { id: 2, name: 'Ventas', type: 'Ingreso' },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/descripción/i), { target: { value: 'Venta de mostrador' } });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /categoría/i }));
    fireEvent.click(await screen.findByRole('option', { name: 'Ventas' }));
    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: '250000' } });

    fireEvent.click(screen.getByRole('button', { name: /confirmar transacción/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/transactions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
