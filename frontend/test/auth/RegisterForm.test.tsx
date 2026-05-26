import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '../../src/components/auth/RegisterForm';
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

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra error si las contrasenas no coinciden', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Lopez' } });
    fireEvent.change(screen.getByLabelText(/correo\s+electr[oó]nico/i), {
      target: { value: 'ana@mail.com' },
    });
    fireEvent.change(screen.getByLabelText(/^contrase[nñ]a$/i), { target: { value: 'abc123' } });
    fireEvent.change(screen.getByLabelText(/confirmar\s+contrase[nñ]a/i), { target: { value: 'xyz123' } });

    fireEvent.click(screen.getByRole('button', { name: /crear\s+cuenta/i }));

    expect(await screen.findByText(/las\s+contrase[nñ]as\s+no\s+coinciden/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('registra usuario y redirige a login', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { mensaje: 'ok' } });

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Lopez' } });
    fireEvent.change(screen.getByLabelText(/correo\s+electr[oó]nico/i), {
      target: { value: 'ana@mail.com' },
    });
    fireEvent.change(screen.getByLabelText(/^contrase[nñ]a$/i), { target: { value: 'Abc12345' } });
    fireEvent.change(screen.getByLabelText(/confirmar\s+contrase[nñ]a/i), { target: { value: 'Abc12345' } });

    fireEvent.click(screen.getByRole('button', { name: /crear\s+cuenta/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Ana',
        lastName: 'Lopez',
        email: 'ana@mail.com',
        password: 'Abc12345',
      });
    });

    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});
