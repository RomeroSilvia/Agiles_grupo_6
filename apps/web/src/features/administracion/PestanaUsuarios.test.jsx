import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, request } from '../../services/api.service.js';
import { renderRoute } from '../../test/renderRoute.jsx';

vi.mock('../../services/api.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const ADMIN = { id: 'u2', email: 'admin@mail.com', esAdmin: true };

const NETFLIX = { id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: '/netflix.png' };

const ANA = {
  id: 'b7d8e1c2-0000-4000-8000-000000000001',
  email: 'ana.lopez@mail.com',
  region: 'AR',
  plataformaIds: [NETFLIX.id],
  titulosWatchlist: 14,
  creadoEn: '2026-10-12T15:30:00.000Z',
  estado: 'activo',
};

const NACHO = {
  id: 'b7d8e1c2-0000-4000-8000-000000000002',
  email: 'nacho.b@mail.com',
  region: 'MX',
  plataformaIds: [],
  titulosWatchlist: 1,
  creadoEn: '2026-09-21T15:30:00.000Z',
  estado: 'sin_confirmar',
};

const SIN_REGION = {
  id: 'b7d8e1c2-0000-4000-8000-000000000003',
  email: 'sin.region@mail.com',
  region: null,
  plataformaIds: [],
  titulosWatchlist: 0,
  creadoEn: '2026-09-01T15:30:00.000Z',
  estado: 'activo',
};

const LISTADO = { usuarios: [ANA, NACHO], total: 12, pagina: 1, totalPaginas: 2 };

function mockApi({
  usuarios = async () => LISTADO,
  sesion = async () => ({ user: ADMIN }),
  plataformas = async () => [NETFLIX],
} = {}) {
  request.mockImplementation(async (path, options) => {
    if (path === '/auth/session') {
      return sesion();
    }
    if (path === '/region') {
      return { region: 'AR', source: 'ip' };
    }
    if (path === '/plataformas') {
      return plataformas();
    }
    if (path === '/plataformas/propias') {
      return [];
    }
    if (path === '/admin/usuarios') {
      return usuarios(options.params);
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

function pedidosDeUsuarios() {
  return request.mock.calls
    .filter(([path]) => path === '/admin/usuarios')
    .map(([, { params }]) => params);
}

function ultimoPedidoDeUsuarios() {
  return pedidosDeUsuarios().at(-1);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Pestaña de usuarios del panel de administración', () => {
  it('muestra el listado con el total, los datos de cada usuario y la paginación', async () => {
    mockApi();
    renderRoute('/admin/usuarios');

    const tabla = await screen.findByRole('table', { name: 'Usuarios registrados' });
    const filaAna = within(tabla).getByRole('row', { name: /ana\.lopez@mail\.com/ });

    expect(screen.getByText('12 usuarios · mostrando 1–2')).toBeInTheDocument();
    expect(within(filaAna).getByText('AR')).toBeInTheDocument();
    expect(within(filaAna).getByRole('img', { name: 'Logo de Netflix' })).toBeInTheDocument();
    expect(within(filaAna).getByText('14 títulos')).toBeInTheDocument();
    expect(within(filaAna).getByText('Activo')).toBeInTheDocument();

    const filaNacho = within(tabla).getByRole('row', { name: /nacho\.b@mail\.com/ });
    expect(within(filaNacho).getByText('—')).toBeInTheDocument();
    expect(within(filaNacho).getByText('1 título')).toBeInTheDocument();
    expect(within(filaNacho).getByText('Sin confirmar')).toBeInTheDocument();

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
  });

  it('un usuario sin región detectada muestra «—» en la región', async () => {
    mockApi({
      usuarios: async () => ({ usuarios: [SIN_REGION], total: 1, pagina: 1, totalPaginas: 1 }),
    });
    renderRoute('/admin/usuarios');

    const tabla = await screen.findByRole('table', { name: 'Usuarios registrados' });
    const fila = within(tabla).getByRole('row', { name: /sin\.region@mail\.com/ });

    expect(within(fila).getAllByText('—')).toHaveLength(2);
    expect(within(fila).queryByText('AR')).not.toBeInTheDocument();
  });

  it('si no carga el catálogo, muestra cuántas plataformas eligió en lugar de «—»', async () => {
    mockApi({
      plataformas: async () => {
        throw new ApiError({
          status: 500,
          code: 'DATABASE',
          message: 'No se pudieron cargar las plataformas',
        });
      },
    });
    renderRoute('/admin/usuarios');

    const tabla = await screen.findByRole('table', { name: 'Usuarios registrados' });
    await screen.findByText('No se pudieron cargar las plataformas');
    const filaAna = within(tabla).getByRole('row', { name: /ana\.lopez@mail\.com/ });

    expect(within(filaAna).getByText('1 plataforma')).toBeInTheDocument();
    expect(within(filaAna).queryByText('—')).not.toBeInTheDocument();
  });

  it('una región no soportada en la URL no filtra y el select muestra todas', async () => {
    mockApi();
    renderRoute('/admin/usuarios?region=ZZ');
    await screen.findByRole('table', { name: 'Usuarios registrados' });

    expect(ultimoPedidoDeUsuarios()).toMatchObject({ region: undefined });
    expect(screen.getByRole('combobox', { name: 'Región' })).toHaveValue('');
  });

  it('buscar por mail pide el listado filtrado desde la página 1', async () => {
    mockApi();
    const router = renderRoute('/admin/usuarios?pagina=2');
    await screen.findByRole('table', { name: 'Usuarios registrados' });

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar por mail' }), 'ana');

    await waitFor(() => expect(ultimoPedidoDeUsuarios()).toMatchObject({ mail: 'ana', pagina: 1 }));
    expect(router.state.location.search).toBe('?mail=ana');
  });

  it('escribir el mail hace un solo pedido cuando se termina de escribir', async () => {
    mockApi();
    renderRoute('/admin/usuarios');
    await screen.findByRole('table', { name: 'Usuarios registrados' });

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar por mail' }), 'ana');

    await waitFor(() => expect(ultimoPedidoDeUsuarios()).toMatchObject({ mail: 'ana' }));
    expect(pedidosDeUsuarios().filter((params) => params.mail)).toEqual([
      { mail: 'ana', region: undefined, estado: undefined, pagina: 1 },
    ]);
  });

  it('al volver a la pestaña sin filtros, el buscador se vacía', async () => {
    mockApi();
    const router = renderRoute('/admin/usuarios?mail=ana');
    await screen.findByRole('table', { name: 'Usuarios registrados' });
    const buscador = screen.getByRole('searchbox', { name: 'Buscar por mail' });
    expect(buscador).toHaveValue('ana');

    await userEvent.click(screen.getByRole('link', { name: 'Usuarios' }));

    await waitFor(() => expect(buscador).toHaveValue(''));
    expect(router.state.location.search).toBe('');
    expect(ultimoPedidoDeUsuarios()).toMatchObject({ mail: undefined, pagina: 1 });
  });

  it('un parámetro inválido o desconocido en la URL no descarta los demás filtros', async () => {
    mockApi();
    renderRoute('/admin/usuarios?mail=ana&pagina=abc&utm=x');
    await screen.findByRole('table', { name: 'Usuarios registrados' });

    expect(ultimoPedidoDeUsuarios()).toEqual({
      mail: 'ana',
      region: undefined,
      estado: undefined,
      pagina: 1,
    });
    expect(screen.getByRole('searchbox', { name: 'Buscar por mail' })).toHaveValue('ana');
  });

  it('una página mayor al total lleva a la última página', async () => {
    mockApi({
      usuarios: async ({ pagina }) => ({ ...LISTADO, pagina }),
    });
    const router = renderRoute('/admin/usuarios?pagina=5');

    await waitFor(() => expect(ultimoPedidoDeUsuarios()).toMatchObject({ pagina: 2 }));
    expect(router.state.location.search).toBe('?pagina=2');
  });

  it('cambiar un filtro vuelve a la página 1 y se combina con la búsqueda', async () => {
    mockApi();
    const router = renderRoute('/admin/usuarios?mail=ana&pagina=2');
    await screen.findByRole('table', { name: 'Usuarios registrados' });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'Activo');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Región' }), 'MX');

    await waitFor(() =>
      expect(ultimoPedidoDeUsuarios()).toEqual({
        mail: 'ana',
        region: 'MX',
        estado: 'activo',
        pagina: 1,
      }),
    );
    expect(new URLSearchParams(router.state.location.search).has('pagina')).toBe(false);
  });

  it('«Siguiente» pide la página 2', async () => {
    mockApi();
    const router = renderRoute('/admin/usuarios');
    await screen.findByRole('table', { name: 'Usuarios registrados' });

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(ultimoPedidoDeUsuarios()).toMatchObject({ pagina: 2 }));
    expect(router.state.location.search).toBe('?pagina=2');
  });

  it('sin resultados muestra que ningún usuario coincide', async () => {
    mockApi({ usuarios: async () => ({ usuarios: [], total: 0, pagina: 1, totalPaginas: 0 }) });
    renderRoute('/admin/usuarios?estado=sin_confirmar');

    expect(await screen.findByText('Ningún usuario coincide con los filtros')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument();
  });

  it('si falla el listado muestra el error y permite reintentar', async () => {
    let fallar = true;
    mockApi({
      usuarios: async () => {
        if (fallar) {
          throw new ApiError({
            status: 500,
            code: 'DATABASE',
            message: 'Error al acceder a los datos',
          });
        }
        return LISTADO;
      },
    });
    renderRoute('/admin/usuarios');

    expect(await screen.findByText('Error al acceder a los datos')).toBeInTheDocument();

    fallar = false;
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('table', { name: 'Usuarios registrados' })).toBeInTheDocument();
  });

  it('si le quitaron el rol, recarga la sesión y muestra el acceso denegado', async () => {
    let esAdmin = true;
    mockApi({
      sesion: async () => ({ user: { ...ADMIN, esAdmin } }),
      usuarios: async () => {
        esAdmin = false;
        throw new ApiError({
          status: 403,
          code: 'FORBIDDEN',
          message: 'No tenés permiso para acceder a esta sección',
        });
      },
    });
    renderRoute('/admin/usuarios');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No tenés acceso a esta sección' }),
    ).toBeInTheDocument();
  });

  it('si la sesión venció, recarga la sesión y lleva a iniciar sesión', async () => {
    let conSesion = true;
    mockApi({
      sesion: async () => (conSesion ? { user: ADMIN } : null),
      usuarios: async () => {
        conSesion = false;
        throw new ApiError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'Tenés que iniciar sesión',
        });
      },
    });
    const router = renderRoute('/admin/usuarios');

    await waitFor(() => expect(router.state.location.pathname).toBe('/iniciar-sesion'));
  });
});
