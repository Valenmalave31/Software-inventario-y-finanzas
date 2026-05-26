import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TargetModal from '../src/components/common-components/TargetModal';

const apiMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  default: apiMock,
}));

describe('TargetModal', () => {
  beforeEach(() => {
    apiMock.post.mockReset();
  });

  it('muestra validación y no envía si faltan datos', async () => {
    const onClose = vi.fn();
    render(<TargetModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar meta/i }));

    expect(await screen.findByText(/El nombre de la meta es obligatorio/i)).toBeInTheDocument();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('envía la meta y cierra el modal', async () => {
    const onClose = vi.fn();
    apiMock.post.mockResolvedValueOnce({ data: { id: 1 } });

    render(<TargetModal open={true} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/nombre de la meta/i), { target: { value: 'Meta ventas' } });
    fireEvent.change(screen.getByLabelText(/monto objetivo/i), { target: { value: '500000' } });
    fireEvent.change(screen.getByLabelText(/desde/i), { target: { value: '2026-04-01' } });
    fireEvent.change(screen.getByLabelText(/hasta/i), { target: { value: '2026-04-30' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar meta/i }));

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    expect(apiMock.post).toHaveBeenCalledWith('/targets', expect.objectContaining({
      name: 'Meta ventas',
      targetAmount: 500000,
    }));
    expect(onClose).toHaveBeenCalled();
  });
});
