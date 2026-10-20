import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, request } from '../../services/api.service.js';
import { renderRoute } from '../../test/renderRoute.jsx';

vi.mock('../../services/api.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const USUARIO = { id: 'u1', email: 'ana@mail.com' };
const PASSWORD = 'Segura#2026';
const PASSWORD_NUEVA = 'Nueva#2026';
const NUEVO_EMAIL = 'nuevo@mail.com';

const CONTRASENA_INCORRECTA = new ApiError({
  status: 403,
  code: 'FORBIDDEN',
  message: 'La contraseña actual no es correcta',
});

function mockApi({
  cambiarMail = async () => undefined,
  cambiarPassword = async () => undefined,
  eliminar = async () => undefined,
} = {}) {
  let sesionActiva = true;
  request.mockImplementation(async (path, options) => {
    if (path === '/auth/session') {
      return sesionActiva ? { user: USUARIO } : null;
    }
    if (path === '/region') {
      return { region: 'AR', source: 'ip' };
    }
    if (path === '/plataformas' || path === '/plataformas/propias') {
      return [];
    }
    if (path === '/busqueda') {
      return { resultados: [], pagina: 1, totalPaginas: 0, totalResultados: 0 };
    }
    if (path === '/auth/email-change') {
      return cambiarMail(options);
    }
    if (path === '/auth/password-change') {
      return cambiarPassword(options);
    }
    if (path === '/auth/password-recovery') {
      return undefined;
    }
    if (path === '/auth/account') {
      const respuesta = await eliminar(options);
      sesionActiva = false;
      return respuesta;
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

function tarjeta(nombre) {
  return screen.findByRole('region', { name: nombre });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockApi();
});

describe('Cuenta: cambiar mail', { timeout: 10_000 }, () => {
  async function pedirCambio(user, password = PASSWORD) {
    const mail = await tarjeta('Mail');
    await user.type(within(mail).getByLabelText('Nuevo mail'), NUEVO_EMAIL);
    await user.click(within(mail).getByRole('button', { name: 'Cambiar mail' }));

    const dialogo = await screen.findByRole('dialog', { name: 'Confirmá tu identidad' });
    await user.type(within(dialogo).getByLabelText('Contraseña actual'), password);
    await user.click(within(dialogo).getByRole('button', { name: 'Enviar enlace' }));
  }

  it('pide la contraseña y avisa que el enlace se mandó al mail nuevo', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    await pedirCambio(user);

    expect(request).toHaveBeenCalledWith('/auth/email-change', {
      method: 'POST',
      body: { email: NUEVO_EMAIL, password: PASSWORD },
    });
    const aviso = await screen.findByRole('dialog', { name: 'Revisá tu nuevo mail' });
    expect(aviso).toHaveTextContent(NUEVO_EMAIL);
    expect(aviso).toHaveTextContent(USUARIO.email);
  });

  it('muestra el error en el campo si el mail no se puede usar', async () => {
    mockApi({
      cambiarMail: async () => {
        throw new ApiError({
          status: 409,
          code: 'CONFLICT',
          message: 'No podés usar ese mail. Probá con otro.',
        });
      },
    });
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    await pedirCambio(user);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      within(await tarjeta('Mail')).getByText('No podés usar ese mail. Probá con otro.'),
    ).toBeInTheDocument();
  });

  it('si la contraseña es incorrecta lo indica sin cerrar el diálogo', async () => {
    mockApi({
      cambiarMail: async () => {
        throw CONTRASENA_INCORRECTA;
      },
    });
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    await pedirCambio(user, 'Incorrecta#1');

    const dialogo = screen.getByRole('dialog', { name: 'Confirmá tu identidad' });
    expect(
      await within(dialogo).findByText('La contraseña actual no es correcta'),
    ).toBeInTheDocument();
  });

  it('cancelar cierra el diálogo sin llamar a la API', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    const mail = await tarjeta('Mail');
    await user.type(within(mail).getByLabelText('Nuevo mail'), NUEVO_EMAIL);
    await user.click(within(mail).getByRole('button', { name: 'Cambiar mail' }));
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalledWith('/auth/email-change', expect.anything());
  });
});

describe('Cuenta: cambiar contraseña', { timeout: 10_000 }, () => {
  async function cambiar(user, actual = PASSWORD) {
    const seccion = await tarjeta('Contraseña');
    await user.type(within(seccion).getByLabelText('Contraseña actual'), actual);
    await user.type(within(seccion).getByLabelText('Contraseña nueva'), PASSWORD_NUEVA);
    await user.type(within(seccion).getByLabelText('Repetí la contraseña nueva'), PASSWORD_NUEVA);
    await user.click(within(seccion).getByRole('button', { name: 'Cambiar contraseña' }));
    return seccion;
  }

  it('cambia la contraseña y lo confirma', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    const seccion = await cambiar(user);

    expect(request).toHaveBeenCalledWith('/auth/password-change', {
      method: 'POST',
      body: { currentPassword: PASSWORD, newPassword: PASSWORD_NUEVA },
    });
    expect(await within(seccion).findByRole('status')).toHaveTextContent(
      'Tu contraseña se actualizó',
    );
    expect(within(seccion).getByLabelText('Contraseña actual')).toHaveValue('');
  });

  it('marca la contraseña actual si no es correcta', async () => {
    mockApi({
      cambiarPassword: async () => {
        throw CONTRASENA_INCORRECTA;
      },
    });
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    const seccion = await cambiar(user, 'Incorrecta#1');

    expect(
      await within(seccion).findByText('La contraseña actual no es correcta'),
    ).toBeInTheDocument();
    expect(within(seccion).getByLabelText('Contraseña actual')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('manda el enlace de restablecimiento al mail de la sesión', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    const seccion = await tarjeta('Contraseña');
    await user.click(
      within(seccion).getByRole('button', { name: 'Enviar enlace de restablecimiento' }),
    );

    expect(request).toHaveBeenCalledWith('/auth/password-recovery', {
      method: 'POST',
      body: { email: USUARIO.email },
    });
    expect(await within(seccion).findByRole('status')).toHaveTextContent(USUARIO.email);
  });
});

describe('Cuenta: eliminar cuenta', { timeout: 10_000 }, () => {
  async function abrirDialogo(user) {
    const seccion = await tarjeta('Eliminar cuenta');
    await user.click(within(seccion).getByRole('button', { name: 'Eliminar mi cuenta' }));
    return screen.findByRole('dialog', { name: '¿Eliminar tu cuenta?' });
  }

  it('cancelar no cambia nada', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    const dialogo = await abrirDialogo(user);
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalledWith('/auth/account', expect.anything());
  });

  it('con ELIMINAR borra la cuenta, cierra la sesión y lleva a la pantalla pública', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    const dialogo = await abrirDialogo(user);
    await user.type(within(dialogo).getByLabelText('Para confirmar, escribí ELIMINAR'), 'ELIMINAR');
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar mi cuenta' }));

    expect(request).toHaveBeenCalledWith('/auth/account', {
      method: 'DELETE',
      body: { confirmation: 'ELIMINAR' },
    });
    expect(await screen.findByRole('link', { name: /Iniciar sesión/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Menú de la cuenta/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cuenta' })).not.toBeInTheDocument();
  });

  it('no deja confirmar con otro texto', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    const dialogo = await abrirDialogo(user);
    await user.type(within(dialogo).getByLabelText('Para confirmar, escribí ELIMINAR'), 'borrar');
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar mi cuenta' }));

    expect(await within(dialogo).findByText('Escribí ELIMINAR para confirmar')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalledWith('/auth/account', expect.anything());
  });

  it('también se puede confirmar con la contraseña', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil/cuenta');

    const dialogo = await abrirDialogo(user);
    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar con mi contraseña' }));
    await user.type(within(dialogo).getByLabelText('Contraseña actual'), PASSWORD);
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar mi cuenta' }));

    expect(request).toHaveBeenCalledWith('/auth/account', {
      method: 'DELETE',
      body: { password: PASSWORD },
    });
  });
});
