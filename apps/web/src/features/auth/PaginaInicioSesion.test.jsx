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

function mockApi({ session = null, signIn } = {}) {
  request.mockImplementation(async (path) => {
    if (path === '/auth/session') {
      return session;
    }
    if (path === '/region') {
      return { region: 'AR' };
    }
    if (path === '/auth/sign-in') {
      return signIn();
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

async function ingresar(user, password = 'Segura#2026') {
  await user.type(await screen.findByLabelText('Mail'), 'ana@mail.com');
  await user.type(screen.getByLabelText('Contraseña'), password);
  await user.click(screen.getByRole('button', { name: 'Ingresar' }));
}

beforeEach(() => {
  vi.resetAllMocks();
  mockApi({ signIn: async () => ({ user: USUARIO }) });
});

describe('Inicio de sesión (E4HU2)', () => {
  it('inicia sesión y lleva al inicio', async () => {
    const user = userEvent.setup();
    renderRoute('/iniciar-sesion');

    await ingresar(user);

    expect(await screen.findByRole('heading', { name: 'Encontrá qué ver' })).toBeInTheDocument();
    expect(screen.getByLabelText('Sesión iniciada como ana@mail.com')).toBeInTheDocument();
  });

  it('muestra un mensaje genérico si las credenciales no son correctas', async () => {
    mockApi({
      signIn: async () => {
        throw new ApiError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'El mail o la contraseña no son correctos',
        });
      },
    });
    const user = userEvent.setup();
    renderRoute('/iniciar-sesion');

    await ingresar(user, 'Incorrecta#1');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El mail o la contraseña no son correctos',
    );
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('pide completar los campos antes de enviar', async () => {
    const user = userEvent.setup();
    renderRoute('/iniciar-sesion');

    await user.click(await screen.findByRole('button', { name: 'Ingresar' }));

    expect(screen.getByText('Ingresá un mail válido')).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Mail')).toHaveFocus();
  });

  it('permite ver la contraseña que se escribe', async () => {
    const user = userEvent.setup();
    renderRoute('/iniciar-sesion');

    const campo = await screen.findByLabelText('Contraseña');
    expect(campo).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(campo).toHaveAttribute('type', 'text');
  });

  it('si ya hay sesión iniciada, lleva al inicio', async () => {
    mockApi({ session: { user: USUARIO } });
    renderRoute('/iniciar-sesion');

    expect(await screen.findByRole('heading', { name: 'Encontrá qué ver' })).toBeInTheDocument();
  });
});
