import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../../src/components/auth/LoginForm';
import api from '../../src/services/api';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../src/services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('inicia sesion, guarda token y navega al dashboard', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        token: 'token-123',
        usuario: { id: 1, correo: 'test@mail.com' },
      },
    });

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/correo\s+electr[oó]nico/i), {
      target: { value: 'test@mail.com' },
    });
    fireEvent.change(screen.getByLabelText(/^contrase[nñ]a$/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByLabelText(/mantener\s+sesi[oó]n\s+iniciada/i));
    fireEvent.click(screen.getByRole('button', { name: /iniciar\s+sesi[oó]n/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@mail.com',
        password: 'secret123',
      });
    });

    expect(localStorage.getItem('token')).toBe('token-123');
    expect(localStorage.getItem('user')).toContain('test@mail.com');
    expect(localStorage.getItem('remember')).toBe('true');
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  it('muestra error cuando falla el login', async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { mensaje: 'Credenciales invalidas' } },
    });

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/correo\s+electr[oó]nico/i), {
      target: { value: 'bad@mail.com' },
    });
    fireEvent.change(screen.getByLabelText(/^contrase[nñ]a$/i), {
      target: { value: 'badpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar\s+sesi[oó]n/i }));

    expect(await screen.findByText(/credenciales\s+inv[aá]lidas/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
