import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MIN_CANTIDAD_TEXTO_BUSCADO, PERIODO_METRICAS } from '@buscador/shared/constants';
import { ApiError, request } from '../../services/api.service.js';
import { renderRoute } from '../../test/renderRoute.jsx';
import { MENSAJE_SIN_DATOS } from './administracion.constants.js';

vi.mock('../../services/api.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const ADMIN = { id: 'u2', email: 'admin@mail.com', esAdmin: true };

const NETFLIX = { id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: '/netflix.png' };

const METRICAS = {
  periodo: PERIODO_METRICAS.TREINTA_DIAS,
  totales: {
    usuarios: 1284,
    usuariosNuevos: 38,
    titulosWatchlist: 6912,
    titulosWatchlistNuevos: 412,
    regionesActivas: 9,
    plataformasElegidas: 8,
  },
  rankings: {
    genero: {
      watchlist: [{ id: 'drama', nombre: 'Drama', cantidad: 1840 }],
      busquedas: [{ id: 'terror', nombre: 'Terror', cantidad: 25 }],
    },
    tipo: {
      watchlist: [
        { tipo: 'pelicula', cantidad: 4010 },
        { tipo: 'serie', cantidad: 2902 },
      ],
      busquedas: [],
    },
    region: { watchlist: [{ region: 'AR', cantidad: 612 }], busquedas: [] },
    plataforma: [{ plataformaId: NETFLIX.id, cantidad: 903 }],
    textosBuscados: [{ texto: 'friends', cantidad: 87 }],
  },
};

function mockApi({ metricas = async () => METRICAS, sesion = async () => ({ user: ADMIN }) } = {}) {
  request.mockImplementation(async (path, options) => {
    if (path === '/auth/session') {
      return sesion();
    }
    if (path === '/region') {
      return { region: 'AR', source: 'ip' };
    }
    if (path === '/plataformas') {
      return [NETFLIX];
    }
    if (path === '/plataformas/propias') {
      return [];
    }
    if (path === '/admin/metricas') {
      return metricas(options.params);
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

function pedidosDeMetricas() {
  return request.mock.calls
    .filter(([path]) => path === '/admin/metricas')
    .map(([, { params }]) => params);
}

function tarjeta(nombre) {
  return screen.getByRole('region', { name: nombre });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Pestaña de métricas del panel de administración', () => {
  it('muestra los totales con los nuevos del período y los rankings', async () => {
    mockApi();
    renderRoute('/admin/metricas');

    expect(await screen.findByText('1.284')).toBeInTheDocument();
    expect(screen.getByText('+38 en 30 días')).toBeInTheDocument();
    expect(screen.getByText('+412 en 30 días')).toBeInTheDocument();
    expect(pedidosDeMetricas()).toEqual([{ periodo: PERIODO_METRICAS.TREINTA_DIAS }]);

    expect(within(tarjeta('Género')).getByText('Drama')).toBeInTheDocument();
    expect(within(tarjeta('Tipo de contenido')).getByText('58%')).toBeInTheDocument();
    expect(within(tarjeta('Región')).getByText('Argentina')).toBeInTheDocument();
    expect(
      await within(tarjeta('Plataforma')).findByRole('img', { name: 'Logo de Netflix' }),
    ).toBeInTheDocument();
    expect(within(tarjeta('Textos más buscados')).getByText('friends')).toBeInTheDocument();
  });

  it('la nota aclara cuántas búsquedas necesita un texto para aparecer', async () => {
    mockApi();
    renderRoute('/admin/metricas');

    expect(
      await screen.findByText(
        new RegExp(`menos de ${MIN_CANTIDAD_TEXTO_BUSCADO} veces no se muestran`),
      ),
    ).toBeInTheDocument();
  });

  it('cambiar el período vuelve a pedir las métricas', async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute('/admin/metricas');
    await screen.findByText('1.284');

    await user.click(screen.getByRole('radio', { name: '7 días' }));

    await waitFor(() =>
      expect(pedidosDeMetricas().at(-1)).toEqual({ periodo: PERIODO_METRICAS.SIETE_DIAS }),
    );
  });

  it('con todo el período no muestra los nuevos', async () => {
    mockApi({ metricas: async () => ({ ...METRICAS, periodo: PERIODO_METRICAS.TODO }) });
    renderRoute('/admin/metricas?periodo=todo');

    await screen.findByText('1.284');
    expect(pedidosDeMetricas()).toEqual([{ periodo: PERIODO_METRICAS.TODO }]);
    expect(screen.queryByText(/\+38/)).not.toBeInTheDocument();
  });

  it('el toggle cambia entre los datos de watchlist y de búsquedas', async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute('/admin/metricas');
    await screen.findByText('1.284');
    const genero = tarjeta('Género');

    await user.click(within(genero).getByRole('radio', { name: 'Búsquedas' }));

    expect(within(genero).getByText('Terror')).toBeInTheDocument();
    expect(within(genero).queryByText('Drama')).not.toBeInTheDocument();
    expect(within(genero).getByText('Búsquedas filtradas por género')).toBeInTheDocument();
  });

  it('un ranking vacío muestra que no hay datos en el período', async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute('/admin/metricas');
    await screen.findByText('1.284');
    const tipo = tarjeta('Tipo de contenido');

    await user.click(within(tipo).getByRole('radio', { name: 'Búsquedas' }));

    expect(within(tipo).getByText(MENSAJE_SIN_DATOS)).toBeInTheDocument();
  });

  it('si la cuenta perdió el rol, recarga la sesión y muestra el acceso denegado', async () => {
    let esAdmin = true;
    mockApi({
      sesion: async () => ({ user: { ...ADMIN, esAdmin } }),
      metricas: async () => {
        esAdmin = false;
        throw new ApiError({ status: 403, code: 'FORBIDDEN', message: 'Sin permiso' });
      },
    });
    renderRoute('/admin/metricas');

    expect(await screen.findByText('No tenés acceso a esta sección')).toBeInTheDocument();
  });
});
