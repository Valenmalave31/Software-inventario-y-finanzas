import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordForm from '../../src/components/auth/ChangePasswordForm';
import api from '../../src/services/api';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams('token=test-token')],
  };
});

vi.mock('../../src/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valida que las contrasenas coincidan antes de enviar', async () => {
    render(
      <MemoryRouter>
        <ResetPasswordForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/nueva\s+contrase[nñ]a/i), { target: { value: 'abc123' } });
    fireEvent.change(screen.getByLabelText(/confirmar\s+contrase[nñ]a/i), { target: { value: 'xyz123' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar\s+nueva\s+contrase[nñ]a/i }));

    expect(await screen.findByText(/las\s+contrase[nñ]as\s+no\s+coinciden/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('envia nueva contrasena y redirige al login', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { mensaje: 'Contraseña restablecida con éxito' } });

    render(
      <MemoryRouter>
        <ResetPasswordForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/nueva\s+contrase[nñ]a/i), { target: { value: 'Abc12345' } });
    fireEvent.change(screen.getByLabelText(/confirmar\s+contrase[nñ]a/i), { target: { value: 'Abc12345' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar\s+nueva\s+contrase[nñ]a/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'test-token',
        newPassword: 'Abc12345',
        confirmPassword: 'Abc12345',
      });
    });

    expect(await screen.findByText(/contrase[nñ]a\s+restablecida\s+con\s+[ée]xito/i)).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});
