import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, request } from '../../services/api.service.js';
import { renderRoute } from '../../test/renderRoute.jsx';

vi.mock('../../services/api.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const USUARIO = { id: 'u1', email: 'ana@mail.com' };
const PLATAFORMAS = [
  { id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: null, urlHome: null },
  { id: 2, tmdbProviderId: 337, nombre: 'Disney Plus', logoPath: null, urlHome: null },
];
const MENU_CUENTA = `Menú de la cuenta de ${USUARIO.email}`;

function mockApi({ session = { user: USUARIO }, guardar = async () => undefined } = {}) {
  request.mockImplementation(async (path, options) => {
    if (path === '/auth/session') {
      return session;
    }
    if (path === '/region') {
      return { region: 'AR', source: 'ip' };
    }
    if (path === '/auth/sign-out') {
      return undefined;
    }
    if (path === '/plataformas') {
      return PLATAFORMAS;
    }
    if (path === '/plataformas/propias') {
      return [1];
    }
    if (path.startsWith('/plataformas/propias/')) {
      return guardar(path, options);
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

function switchDe(nombre) {
  return screen.findByRole('switch', { name: nombre });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockApi();
});

describe('Perfil', () => {
  it('con sesión muestra el mail, la región y las plataformas del usuario', async () => {
    renderRoute('/perfil');

    expect(await screen.findByRole('heading', { level: 1, name: 'Mi perfil' })).toBeInTheDocument();
    const datos = screen.getByRole('region', { name: 'Datos de la cuenta' });
    expect(within(datos).getByText(USUARIO.email)).toBeInTheDocument();
    expect(await within(datos).findByText('AR')).toBeInTheDocument();
    expect(within(datos).getByText('Región detectada')).toBeInTheDocument();
    expect(await switchDe('Netflix')).toHaveAttribute('aria-checked', 'true');
    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-checked', 'false');
  });

  it('sin sesión lleva a iniciar sesión y no muestra datos privados', async () => {
    mockApi({ session: null });
    renderRoute('/perfil');

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByText(USUARIO.email)).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalledWith('/plataformas/propias');
  });

  it('guarda el cambio de plataformas y se ve en Mis plataformas', async () => {
    const user = userEvent.setup();
    const router = renderRoute('/perfil');

    await user.click(await switchDe('Disney Plus'));
    expect(request).toHaveBeenCalledWith('/plataformas/propias/2', { method: 'PUT' });

    await act(() => router.navigate('/mis-plataformas'));

    expect(await screen.findByRole('heading', { name: 'Mis plataformas' })).toBeInTheDocument();
    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-checked', 'true');
    expect(request.mock.calls.filter(([path]) => path === '/plataformas/propias')).toHaveLength(1);
  });

  it('si no se puede guardar, vuelve el switch atrás y muestra el error', async () => {
    mockApi({
      guardar: async () => {
        throw new ApiError({
          status: 500,
          code: 'DATABASE',
          message: 'Error al acceder a los datos',
        });
      },
    });
    const user = userEvent.setup();
    renderRoute('/perfil');

    await user.click(await switchDe('Disney Plus'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error al acceder a los datos');
    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-checked', 'false');
  });

  it('muestra las acciones de cuenta como próximamente, sin enlaces', async () => {
    renderRoute('/perfil');

    for (const titulo of ['Cambiar mail', 'Restablecer contraseña', 'Eliminar cuenta']) {
      expect(await screen.findByText(titulo)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: new RegExp(titulo) })).not.toBeInTheDocument();
    }
    expect(screen.getAllByText('Próximamente')).toHaveLength(3);
  });

  it('en celular abre y cierra cada sección', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil');

    const seccion = await screen.findByRole('button', { name: /Mis plataformas/ });
    expect(seccion).toHaveAttribute('aria-expanded', 'false');

    await user.click(seccion);
    expect(seccion).toHaveAttribute('aria-expanded', 'true');

    await user.click(seccion);
    expect(seccion).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Menú de la cuenta del header', () => {
  it('ofrece Perfil y Cerrar sesión, y Cerrar sesión ya no está suelto en el header', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    const avatar = await screen.findByRole('button', { name: MENU_CUENTA });
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();

    await user.click(avatar);

    const menu = screen.getByRole('menu', { name: MENU_CUENTA });
    expect(within(menu).getByRole('menuitem', { name: 'Perfil' })).toHaveAttribute(
      'href',
      '/perfil',
    );
    expect(within(menu).getByRole('menuitem', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('lleva al perfil y marca el link Perfil como página actual', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    await user.click(await screen.findByRole('button', { name: MENU_CUENTA }));
    await user.click(screen.getByRole('menuitem', { name: 'Perfil' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Mi perfil' })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: 'Perfil' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('cierra la sesión desde el perfil y lleva a iniciar sesión', async () => {
    const user = userEvent.setup();
    renderRoute('/perfil');

    await user.click(await screen.findByRole('button', { name: MENU_CUENTA }));
    await user.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));

    expect(request).toHaveBeenCalledWith('/auth/sign-out', { method: 'POST' });
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByText(USUARIO.email)).not.toBeInTheDocument();
  });
});
