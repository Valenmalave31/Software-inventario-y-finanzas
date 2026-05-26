import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecoveryPasswordForm from '../../src/components/auth/RecoveryPasswordForm';
import api from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('RecoveryPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra mensaje de exito cuando el correo fue enviado', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { mensaje: 'Correo enviado con instrucciones' },
    });

    render(
      <MemoryRouter>
        <RecoveryPasswordForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/correo\s+electr[oó]nico/i), {
      target: { value: 'user@mail.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar\s+enlace\s+de\s+recuperaci[oó]n/i }));

    expect(await screen.findByText(/correo\s+enviado\s+con\s+instrucciones/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando falla la peticion', async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { mensaje: 'Error al enviar el correo' } },
    });

    render(
      <MemoryRouter>
        <RecoveryPasswordForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/correo\s+electr[oó]nico/i), {
      target: { value: 'user@mail.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar\s+enlace\s+de\s+recuperaci[oó]n/i }));

    expect(await screen.findByText(/error\s+al\s+enviar\s+el\s+correo/i)).toBeInTheDocument();
  });
});
