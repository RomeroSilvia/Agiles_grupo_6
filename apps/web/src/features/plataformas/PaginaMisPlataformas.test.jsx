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
const ERROR_API = new ApiError({
  status: 500,
  code: 'DATABASE',
  message: 'Error al acceder a los datos',
});

function mockApi({
  session = { user: USUARIO },
  catalogo = async () => PLATAFORMAS,
  propias = async () => [1],
  guardar = async () => undefined,
} = {}) {
  request.mockImplementation(async (path, options) => {
    if (path === '/auth/session') {
      return session;
    }
    if (path === '/region') {
      return { region: 'AR' };
    }
    if (path === '/auth/sign-out') {
      return undefined;
    }
    if (path === '/plataformas') {
      return catalogo();
    }
    if (path === '/plataformas/propias') {
      return propias();
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

describe('Mis plataformas', () => {
  it('lista las plataformas disponibles con las del usuario marcadas', async () => {
    renderRoute('/mis-plataformas');

    expect(await screen.findByRole('heading', { name: 'Mis plataformas' })).toBeInTheDocument();
    expect(await switchDe('Netflix')).toHaveAttribute('aria-checked', 'true');
    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Se guarda automáticamente.')).toBeInTheDocument();
    expect(screen.queryByText(/Todavía no elegiste ninguna plataforma/)).not.toBeInTheDocument();
  });

  it('mientras carga avisa que está cargando y no muestra switches', async () => {
    mockApi({ catalogo: () => new Promise(() => {}) });
    renderRoute('/mis-plataformas');

    expect(await screen.findByRole('status')).toHaveTextContent('Cargando plataformas');
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('guarda al activar una plataforma', async () => {
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    await user.click(await switchDe('Disney Plus'));

    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-checked', 'true');
    expect(request).toHaveBeenCalledWith('/plataformas/propias/2', { method: 'PUT' });
  });

  it('guarda al desactivar una plataforma', async () => {
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    await user.click(await switchDe('Netflix'));

    expect(await switchDe('Netflix')).toHaveAttribute('aria-checked', 'false');
    expect(request).toHaveBeenCalledWith('/plataformas/propias/1', { method: 'DELETE' });
  });

  it('a un usuario sin plataformas le muestra el aviso y todas las plataformas sin marcar', async () => {
    mockApi({ propias: async () => [] });
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    expect(await screen.findByText(/Todavía no elegiste ninguna plataforma/)).toBeInTheDocument();
    expect(await switchDe('Netflix')).toHaveAttribute('aria-checked', 'false');
    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-checked', 'false');

    await user.click(await switchDe('Netflix'));

    expect(screen.queryByText(/Todavía no elegiste ninguna plataforma/)).not.toBeInTheDocument();
  });

  it('si no se puede guardar, vuelve el switch atrás y muestra el error', async () => {
    mockApi({
      guardar: async () => {
        throw ERROR_API;
      },
    });
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    await user.click(await switchDe('Disney Plus'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error al acceder a los datos');
    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-checked', 'false');
  });

  it('si no se puede quitar, vuelve a marcar la plataforma y muestra el error', async () => {
    mockApi({
      guardar: async () => {
        throw ERROR_API;
      },
    });
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    await user.click(await switchDe('Netflix'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error al acceder a los datos');
    expect(await switchDe('Netflix')).toHaveAttribute('aria-checked', 'true');
  });

  it('mientras guarda deshabilita el switch y no manda un segundo pedido', async () => {
    let terminarGuardado;
    mockApi({
      guardar: () =>
        new Promise((resolve) => {
          terminarGuardado = resolve;
        }),
    });
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    const control = await switchDe('Disney Plus');
    await user.click(control);
    await user.click(control);

    expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(control).toHaveAttribute('aria-checked', 'true');
    const guardados = request.mock.calls.filter(([path]) =>
      path.startsWith('/plataformas/propias/'),
    );
    expect(guardados).toEqual([['/plataformas/propias/2', { method: 'PUT' }]]);

    terminarGuardado();

    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-disabled', 'false');
  });

  it('solo deshabilita la plataforma que se está guardando', async () => {
    mockApi({ guardar: () => new Promise(() => {}) });
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    await user.click(await switchDe('Disney Plus'));

    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-disabled', 'true');
    expect(await switchDe('Netflix')).toHaveAttribute('aria-disabled', 'false');
  });

  it('si no hay plataformas disponibles no muestra switches ni el aviso de selección vacía', async () => {
    mockApi({ catalogo: async () => [], propias: async () => [] });
    renderRoute('/mis-plataformas');

    expect(await screen.findByText('Se guarda automáticamente.')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByText(/Todavía no elegiste ninguna plataforma/)).not.toBeInTheDocument();
  });

  it('muestra el error si no se pueden cargar las plataformas', async () => {
    mockApi({
      catalogo: async () => {
        throw ERROR_API;
      },
    });
    renderRoute('/mis-plataformas');

    expect(await screen.findByRole('alert')).toHaveTextContent('Error al acceder a los datos');
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByText('Se guarda automáticamente.')).not.toBeInTheDocument();
  });

  it('si no se puede cargar la selección, muestra el error y no la lista sin marcar', async () => {
    mockApi({
      propias: async () => {
        throw ERROR_API;
      },
    });
    renderRoute('/mis-plataformas');

    expect(await screen.findByRole('alert')).toHaveTextContent('Error al acceder a los datos');
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByText(/Todavía no elegiste ninguna plataforma/)).not.toBeInTheDocument();
  });

  it('mantiene la selección al ir a otra pantalla y volver, sin volver a pedirla', async () => {
    const user = userEvent.setup();
    const router = renderRoute('/mis-plataformas');

    await user.click(await switchDe('Disney Plus'));
    await act(() => router.navigate('/'));
    await act(() => router.navigate('/mis-plataformas'));

    expect(await switchDe('Netflix')).toHaveAttribute('aria-checked', 'true');
    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-checked', 'true');
    expect(request.mock.calls.filter(([path]) => path === '/plataformas/propias')).toHaveLength(1);
  });

  it('si falló la carga de la selección, la vuelve a pedir al volver a la pantalla', async () => {
    let fallar = true;
    mockApi({
      propias: async () => {
        if (fallar) {
          throw ERROR_API;
        }
        return [1];
      },
    });
    const router = renderRoute('/mis-plataformas');
    await screen.findByRole('alert');

    fallar = false;
    await act(() => router.navigate('/'));
    await act(() => router.navigate('/mis-plataformas'));

    expect(await switchDe('Netflix')).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(request.mock.calls.filter(([path]) => path === '/plataformas/propias')).toHaveLength(2);
  });

  it('reintenta cargar la selección con el botón Reintentar', async () => {
    let fallar = true;
    mockApi({
      propias: async () => {
        if (fallar) {
          throw ERROR_API;
        }
        return [1];
      },
    });
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    const boton = await screen.findByRole('button', { name: 'Reintentar' }, { timeout: 5_000 });
    fallar = false;
    await user.click(boton);

    expect(await switchDe('Netflix')).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('reintenta cargar el catálogo con el botón Reintentar', async () => {
    let fallar = true;
    mockApi({
      catalogo: async () => {
        if (fallar) {
          throw ERROR_API;
        }
        return PLATAFORMAS;
      },
    });
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    const boton = await screen.findByRole('button', { name: 'Reintentar' });
    fallar = false;
    await user.click(boton);

    expect(await switchDe('Disney Plus')).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('si el reintento vuelve a fallar, sigue mostrando el error y el botón', async () => {
    mockApi({
      propias: async () => {
        throw ERROR_API;
      },
    });
    const user = userEvent.setup();
    renderRoute('/mis-plataformas');

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Error al acceder a los datos');
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(request.mock.calls.filter(([path]) => path === '/plataformas/propias')).toHaveLength(2);
  });

  it('sin sesión lleva a iniciar sesión', async () => {
    mockApi({ session: null });
    renderRoute('/mis-plataformas');

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(request).not.toHaveBeenCalledWith('/plataformas/propias');
  });
});

describe('Link "Mis plataformas" del header', () => {
  it('aparece con sesión iniciada', async () => {
    renderRoute('/');

    expect(await screen.findByRole('link', { name: 'Mis plataformas' })).toHaveAttribute(
      'href',
      '/mis-plataformas',
    );
  });

  it('se marca como página actual en Mis plataformas', async () => {
    renderRoute('/mis-plataformas');

    expect(await screen.findByRole('link', { name: 'Mis plataformas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('no aparece sin sesión', async () => {
    mockApi({ session: null });
    renderRoute('/');

    expect(await screen.findByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mis plataformas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Abrir menú' })).not.toBeInTheDocument();
  });
});

describe('Menú hamburguesa', () => {
  it('se abre con el link a Mis plataformas y la opción de cerrar sesión', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    const boton = await screen.findByRole('button', { name: 'Abrir menú' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');

    await user.click(boton);

    const menu = screen.getByRole('navigation', { name: 'Menú' });
    expect(within(menu).getByRole('link', { name: 'Mis plataformas' })).toBeInTheDocument();
    expect(within(menu).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('se cierra al ir a una sección', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    await user.click(await screen.findByRole('button', { name: 'Abrir menú' }));
    const menu = screen.getByRole('navigation', { name: 'Menú' });
    await user.click(within(menu).getByRole('link', { name: 'Mis plataformas' }));

    expect(await screen.findByRole('heading', { name: 'Mis plataformas' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Menú' })).not.toBeInTheDocument();
  });

  it('cierra la sesión desde el menú', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    await user.click(await screen.findByRole('button', { name: 'Abrir menú' }));
    const menu = screen.getByRole('navigation', { name: 'Menú' });
    await user.click(within(menu).getByRole('button', { name: 'Cerrar sesión' }));

    expect(request).toHaveBeenCalledWith('/auth/sign-out', { method: 'POST' });
    expect(await screen.findByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Menú' })).not.toBeInTheDocument();
  });
});
