import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, request } from '../../services/api.service.js';
import { renderRoute } from '../../test/renderRoute.jsx';

vi.mock('../../services/api.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const USUARIO = { id: 'u1', email: 'ana@mail.com' };

function mockApi({ signUp } = {}) {
  request.mockImplementation(async (path) => {
    if (path === '/auth/session') {
      return null;
    }
    if (path === '/region') {
      return { region: 'AR' };
    }
    if (path === '/auth/sign-up') {
      return signUp();
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

function requisito(texto) {
  return screen.getByText(texto).closest('li');
}

async function completarFormulario(user, { email, password, confirmPassword = password }) {
  await user.type(await screen.findByLabelText('Mail'), email);
  await user.type(screen.getByLabelText('Contraseña'), password);
  await user.type(screen.getByLabelText('Repetí la contraseña'), confirmPassword);
}

beforeEach(() => {
  vi.resetAllMocks();
  mockApi({ signUp: async () => ({ user: USUARIO }) });
});

describe('Registro (E4HU2)', () => {
  it('marca los requisitos de la contraseña a medida que se cumplen', async () => {
    const user = userEvent.setup();
    renderRoute('/registro');

    const campo = await screen.findByLabelText('Contraseña');
    expect(requisito('Una mayúscula')).toHaveTextContent('(pendiente)');

    await user.type(campo, 'Abc');

    expect(requisito('Una mayúscula')).toHaveTextContent('(cumplido)');
    expect(requisito('Una minúscula')).toHaveTextContent('(cumplido)');
    expect(requisito('Un número')).toHaveTextContent('(pendiente)');
    expect(requisito('Al menos 8 caracteres')).toHaveTextContent('(pendiente)');
  });

  it('avisa al salir del campo si las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    renderRoute('/registro');

    await completarFormulario(user, {
      email: 'ana@mail.com',
      password: 'Segura#2026',
      confirmPassword: 'Segura#2027',
    });
    await user.tab();

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });

  it('no envía el formulario si la contraseña es débil y lleva el foco al campo', async () => {
    const user = userEvent.setup();
    renderRoute('/registro');

    await completarFormulario(user, { email: 'ana@mail.com', password: 'debil' });
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(screen.getByLabelText('Contraseña')).toHaveFocus();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true');
    expect(request).not.toHaveBeenCalledWith('/auth/sign-up', expect.anything());
  });

  it('crea la cuenta, deja la sesión iniciada y lleva al inicio', async () => {
    const user = userEvent.setup();
    renderRoute('/registro');

    await completarFormulario(user, { email: 'ana@mail.com', password: 'Segura#2026' });
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByRole('heading', { name: 'Una búsqueda. Todas tus plataformas.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith('/auth/sign-up', {
      method: 'POST',
      body: { email: 'ana@mail.com', password: 'Segura#2026' },
    });
  });

  it('muestra el error de la API si el mail ya está registrado', async () => {
    mockApi({
      signUp: async () => {
        throw new ApiError({
          status: 409,
          code: 'CONFLICT',
          message: 'Ese mail ya está registrado. Iniciá sesión o usá otro mail.',
        });
      },
    });
    const user = userEvent.setup();
    renderRoute('/registro');

    await completarFormulario(user, { email: 'ana@mail.com', password: 'Segura#2026' });
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText(/Ese mail ya está registrado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled();
  });
});
