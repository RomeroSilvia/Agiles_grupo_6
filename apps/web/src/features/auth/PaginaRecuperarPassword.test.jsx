import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, request } from '../../services/api.service.js';
import { renderRoute } from '../../test/renderRoute.jsx';

vi.mock('../../services/api.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const TOKEN = 'token-del-enlace';

function mockApi({ recuperar = async () => undefined, restablecer = async () => undefined } = {}) {
  request.mockImplementation(async (path, options) => {
    if (path === '/auth/session') {
      return null;
    }
    if (path === '/region') {
      return { region: 'AR' };
    }
    if (path === '/auth/password-recovery') {
      return recuperar(options);
    }
    if (path === '/auth/password-reset') {
      return restablecer(options);
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockApi();
});

describe('Recuperar contraseña', () => {
  it('se llega desde el inicio de sesión', async () => {
    const user = userEvent.setup();
    renderRoute('/iniciar-sesion');

    await user.click(await screen.findByRole('link', { name: '¿Olvidaste tu contraseña?' }));

    expect(
      await screen.findByRole('heading', { name: 'Recuperar contraseña' }),
    ).toBeInTheDocument();
  });

  it('pide el enlace y muestra la confirmación', async () => {
    const user = userEvent.setup();
    renderRoute('/recuperar-contrasena');

    await user.type(await screen.findByLabelText('Mail'), 'ana@mail.com');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(request).toHaveBeenCalledWith('/auth/password-recovery', {
      method: 'POST',
      body: { email: 'ana@mail.com' },
    });
    expect(await screen.findByRole('heading', { name: 'Revisá tu mail' })).toBeInTheDocument();
    expect(screen.getByText(/Si el mail ingresado corresponde a una cuenta/)).toBeInTheDocument();
  });

  it('no envía un mail inválido', async () => {
    const user = userEvent.setup();
    renderRoute('/recuperar-contrasena');

    await user.type(await screen.findByLabelText('Mail'), 'no-es-un-mail');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(await screen.findByText('Ingresá un mail válido')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalledWith('/auth/password-recovery', expect.anything());
  });

  it('muestra el error si no se pudo pedir el enlace', async () => {
    mockApi({
      recuperar: async () => {
        throw new ApiError({ status: 0, code: 'NETWORK', message: 'No pudimos conectarnos.' });
      },
    });
    const user = userEvent.setup();
    renderRoute('/recuperar-contrasena');

    await user.type(await screen.findByLabelText('Mail'), 'ana@mail.com');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectarnos.');
    expect(screen.queryByRole('heading', { name: 'Revisá tu mail' })).not.toBeInTheDocument();
  });
});

describe('Contraseña nueva', { timeout: 10_000 }, () => {
  async function guardarPassword(user, password = 'Nueva#2026') {
    await user.type(await screen.findByLabelText('Contraseña nueva'), password);
    await user.type(screen.getByLabelText('Repetí la contraseña nueva'), password);
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
  }

  it('guarda la contraseña con el token del enlace', async () => {
    const user = userEvent.setup();
    renderRoute(`/restablecer-contrasena#token=${TOKEN}`);

    await guardarPassword(user);

    expect(request).toHaveBeenCalledWith('/auth/password-reset', {
      method: 'POST',
      body: { token: TOKEN, password: 'Nueva#2026' },
    });
    expect(
      await screen.findByRole('heading', { name: 'Tu contraseña se actualizó' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/iniciar-sesion',
    );
  });

  it('si el enlace venció ofrece pedir otro', async () => {
    mockApi({
      restablecer: async () => {
        throw new ApiError({ status: 400, code: 'INVALID_LINK', message: 'El enlace venció' });
      },
    });
    const user = userEvent.setup();
    renderRoute(`/restablecer-contrasena#token=${TOKEN}`);

    await guardarPassword(user);

    expect(
      await screen.findByRole('heading', { name: 'El enlace venció o ya se usó' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir otro enlace' })).toHaveAttribute(
      'href',
      '/recuperar-contrasena',
    );
  });

  it('sin token muestra que el enlace no sirve', async () => {
    renderRoute('/restablecer-contrasena');

    expect(
      await screen.findByRole('heading', { name: 'El enlace venció o ya se usó' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Contraseña nueva')).not.toBeInTheDocument();
  });

  it('no envía si las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    renderRoute(`/restablecer-contrasena#token=${TOKEN}`);

    await user.type(await screen.findByLabelText('Contraseña nueva'), 'Nueva#2026');
    await user.type(screen.getByLabelText('Repetí la contraseña nueva'), 'Otra#2026');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalledWith('/auth/password-reset', expect.anything());
  });
});
