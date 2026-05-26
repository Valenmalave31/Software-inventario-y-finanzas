import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import BudgetModal from '../src/components/common-components/BudgetModal';

const apiMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  default: apiMock,
}));

describe('BudgetModal', () => {
  beforeEach(() => {
    apiMock.post.mockReset();
  });

  it('muestra validación y no envía si el monto es 0', async () => {
    const onClose = vi.fn();
    render(<BudgetModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar presupuesto/i }));

    expect(await screen.findByText(/El monto debe ser mayor a 0/i)).toBeInTheDocument();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('envía el presupuesto y cierra el modal', async () => {
    const onClose = vi.fn();
    apiMock.post.mockResolvedValueOnce({ data: { id: 1 } });

    render(<BudgetModal open={true} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/nombre del presupuesto/i), { target: { value: 'Servicios marzo' } });
    fireEvent.change(screen.getByLabelText(/monto asignado/i), { target: { value: '150000' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar presupuesto/i }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post).toHaveBeenCalledWith('/budgets', expect.objectContaining({
      allocated_amount: 150000,
      name: 'Servicios marzo',
    }));
    expect(onClose).toHaveBeenCalled();
  });
});
