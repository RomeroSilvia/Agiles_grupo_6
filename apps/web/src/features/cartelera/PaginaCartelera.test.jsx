import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { CARTELERA_CACHE_TTL_MS } from '@buscador/shared/constants';
import { renderRoute } from '../../test/renderRoute.jsx';

const consultadoEn = '2026-11-13T23:00:00.000Z';

const DUNE = {
  tmdbId: 77,
  tipo: 'pelicula',
  nombre: 'Dune',
  posterUrl: null,
  anio: 2021,
  puntuacion: 8.1,
  region: 'AR',
  estadoExhibicion: 'cartelera_proveedor',
  fechaEstrenoAr: '2026-06-08',
  estadoFecha: 'informada',
  fuente: {
    fuenteId: 'tmdb',
    registroId: '77',
    url: null,
    consultadoEn,
    actualizadoEn: null,
  },
};

const PELICULA_SIN_FECHA = {
  ...DUNE,
  tmdbId: 78,
  nombre: null,
  estadoFecha: 'pendiente',
  fechaEstrenoAr: null,
  fuente: { ...DUNE.fuente, registroId: '78' },
};

function respuestaCartelera(resultados, pagina = 1, totalPaginas = 1) {
  return {
    data: {
      region: 'AR',
      resultados,
      pagina,
      totalResultados: resultados.length,
      totalPaginas,
      fuente: {
        fuenteId: 'tmdb',
        registroId: null,
        url: null,
        consultadoEn,
        actualizadoEn: null,
      },
    },
  };
}

function respuestaHttp(contenido, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => contenido,
  };
}

function configurarFetchCartelera(responder) {
  const fetchMock = vi.fn((input) => {
    const url = new URL(input.toString(), window.location.origin);

    if (url.pathname === '/api/auth/session') {
      return Promise.resolve(respuestaHttp({ data: { user: null } }));
    }
    if (url.pathname === '/api/region') {
      return Promise.resolve(respuestaHttp({ data: { region: 'AR' } }));
    }
    if (url.pathname === '/api/cartelera/ciudades') {
      return Promise.resolve(respuestaHttp({ data: { pais: 'AR', ciudades: [] } }));
    }
    if (url.pathname === '/api/cartelera') {
      return responder(url);
    }
    if (url.pathname === '/api/titulos/pelicula/78') {
      return Promise.resolve(respuestaHttp({ data: { ...PELICULA_SIN_FECHA, sinopsis: null } }));
    }
    if (url.pathname === '/api/titulos/pelicula/78/disponibilidad') {
      return Promise.resolve(respuestaHttp({ data: { ofertas: [], enlaceTmdb: null } }));
    }

    throw new Error(`URL no mockeada: ${url.pathname}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PaginaCartelera', () => {
  it.each([
    ['vencido', Date.now()],
    ['sin vencimiento', undefined],
    ['con vencimiento inválido', 'invalido'],
  ])('consulta la primera página al recargar un estado %s', async (_caso, expiresAt) => {
    const responder = vi
      .fn()
      .mockResolvedValue(respuestaHttp(respuestaCartelera([PELICULA_SIN_FECHA])));
    configurarFetchCartelera(responder);

    renderRoute({
      pathname: '/cartelera',
      state: {
        cartelera: { resultados: [DUNE], pagina: 2, totalPaginas: 3, expiresAt },
      },
    });

    expect(screen.getByText('Cargando películas en cartelera…')).toBeVisible();
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Título no disponible' }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { level: 3, name: 'Dune' })).not.toBeInTheDocument();
    expect(responder).toHaveBeenCalledOnce();
    expect(responder.mock.calls[0][0].searchParams.get('pagina')).toBe('1');
  });

  it('restaura un estado vigente sin extender su vencimiento ni consultar la API', async () => {
    const expiresAt = Date.now() + CARTELERA_CACHE_TTL_MS / 2;
    const responder = vi.fn();
    configurarFetchCartelera(responder);

    const router = renderRoute({
      pathname: '/cartelera',
      state: {
        cartelera: { resultados: [DUNE], pagina: 2, totalPaginas: 3, expiresAt },
      },
    });

    expect(await screen.findByRole('heading', { level: 3, name: 'Dune' })).toBeVisible();
    expect(responder).not.toHaveBeenCalled();
    expect(router.state.location.state.cartelera.expiresAt).toBe(expiresAt);
  });

  it('vence desde la primera página aunque se carguen más páginas antes de volver del detalle', async () => {
    const ahora = Date.now();
    const dateNow = vi.spyOn(Date, 'now').mockReturnValue(ahora);
    const responder = vi.fn((url) => {
      const pagina = Number(url.searchParams.get('pagina'));
      return Promise.resolve(
        respuestaHttp(respuestaCartelera(pagina === 1 ? [DUNE] : [PELICULA_SIN_FECHA], pagina, 2)),
      );
    });
    configurarFetchCartelera(responder);
    const router = renderRoute('/cartelera');

    await waitFor(() =>
      expect(router.state.location.state?.cartelera?.expiresAt).toBe(
        ahora + CARTELERA_CACHE_TTL_MS,
      ),
    );
    dateNow.mockReturnValue(ahora + CARTELERA_CACHE_TTL_MS / 2);
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));
    await waitFor(() => expect(router.state.location.state?.cartelera?.pagina).toBe(2));
    expect(router.state.location.state.cartelera.expiresAt).toBe(ahora + CARTELERA_CACHE_TTL_MS);
    fireEvent.click(screen.getByRole('link', { name: 'Ver detalle de Título no disponible' }));
    await screen.findByRole('link', { name: 'Volver a la búsqueda' });

    dateNow.mockReturnValue(ahora + CARTELERA_CACHE_TTL_MS);
    await act(async () => router.navigate(-1));

    expect(await screen.findByRole('heading', { level: 3, name: 'Dune' })).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 3, name: 'Título no disponible' }),
    ).not.toBeInTheDocument();
    expect(responder.mock.calls.map(([url]) => url.searchParams.get('pagina'))).toEqual([
      '1',
      '2',
      '1',
    ]);
  });

  it('muestra carga accesible y luego fecha, atribución y enlace al detalle existente', async () => {
    let resolver;
    configurarFetchCartelera(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        }),
    );

    renderRoute('/cartelera');

    expect(screen.getByText('Cargando películas en cartelera…')).toBeVisible();
    expect(
      screen.getByText('Cartelera según TMDB; las funciones dependen de cada cine.'),
    ).toBeVisible();

    await act(async () => resolver(respuestaHttp(respuestaCartelera([DUNE, PELICULA_SIN_FECHA]))));

    expect(await screen.findByRole('heading', { level: 3, name: 'Dune' })).toBeInTheDocument();
    const enlaceDetalle = screen.getByRole('link', { name: 'Ver detalle de Dune' });
    expect(enlaceDetalle).toHaveAttribute('href', '/titulos/pelicula/77');
    expect(screen.getByText('Estreno en Argentina: 8 de junio de 2026')).toHaveAttribute(
      'dateTime',
      '2026-06-08',
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Título no disponible' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Fecha de estreno en Argentina no informada')).toBeInTheDocument();
    expect(screen.getAllByText(/Datos de títulos provistos por/)).toHaveLength(1);
  });

  it('distingue cartelera vacía y permite reintentar un error', async () => {
    const fetchMock = configurarFetchCartelera(
      vi
        .fn()
        .mockResolvedValueOnce(
          respuestaHttp(
            { error: { code: 'EXTERNAL_SERVICE', message: 'No se pudo consultar TMDB' } },
            502,
          ),
        )
        .mockResolvedValueOnce(respuestaHttp(respuestaCartelera([]))),
    );

    renderRoute('/cartelera');

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo consultar TMDB');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay información de cartelera disponible.')).toBeVisible();
    expect(
      fetchMock.mock.calls.filter(
        ([input]) => new URL(input.toString()).pathname === '/api/cartelera',
      ),
    ).toHaveLength(2);
  });

  it('acumula páginas por identidad de película sin duplicar tarjetas', async () => {
    const fetchMock = configurarFetchCartelera((url) => {
      const pagina = Number(url.searchParams.get('pagina'));
      return Promise.resolve(
        respuestaHttp(
          respuestaCartelera(pagina === 1 ? [DUNE] : [DUNE, PELICULA_SIN_FECHA], pagina, 2),
        ),
      );
    });

    renderRoute('/cartelera');
    await screen.findByRole('heading', { level: 3, name: 'Dune' });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Título no disponible' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3, name: 'Dune' })).toHaveLength(1);
    await waitFor(() => {
      expect(
        fetchMock.mock.calls
          .filter(([input]) => new URL(input.toString()).pathname === '/api/cartelera')
          .map(([input]) => new URL(input.toString()).searchParams.get('pagina')),
      ).toEqual(['1', '2']);
    });
  });

  it.each(['enlace del detalle', 'navegador'])(
    'restaura todas las páginas al volver con el %s y continúa desde la siguiente',
    async (modo) => {
      const terceraPelicula = { ...DUNE, tmdbId: 79, nombre: 'Tercera película' };
      const paginas = [[DUNE], [PELICULA_SIN_FECHA], [terceraPelicula]];
      const fetchMock = configurarFetchCartelera((url) => {
        const pagina = Number(url.searchParams.get('pagina'));
        return Promise.resolve(respuestaHttp(respuestaCartelera(paginas[pagina - 1], pagina, 3)));
      });
      const router = renderRoute('/cartelera');
      await screen.findByRole('link', { name: 'Ver detalle de Dune' });
      fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));
      await screen.findByRole('link', { name: 'Ver detalle de Título no disponible' });
      await waitFor(() => expect(router.state.location.state?.cartelera?.pagina).toBe(2));
      fireEvent.click(screen.getByRole('link', { name: 'Ver detalle de Título no disponible' }));
      const volver = await screen.findByRole('link', { name: 'Volver a la búsqueda' });

      if (modo === 'navegador') {
        await act(async () => router.navigate(-1));
      } else {
        fireEvent.click(volver);
      }

      expect(await screen.findByRole('link', { name: 'Ver detalle de Dune' })).toBeVisible();
      expect(
        screen.getByRole('link', { name: 'Ver detalle de Título no disponible' }),
      ).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));
      expect(
        await screen.findByRole('link', { name: 'Ver detalle de Tercera película' }),
      ).toBeVisible();
      expect(
        fetchMock.mock.calls
          .filter(([url]) => url.pathname === '/api/cartelera')
          .map(([url]) => url.searchParams.get('pagina')),
      ).toEqual(['1', '2', '3']);
    },
  );

  it('conserva las páginas previas y reintenta la página que falló al cargar más', async () => {
    configurarFetchCartelera(
      vi
        .fn()
        .mockResolvedValueOnce(respuestaHttp(respuestaCartelera([DUNE], 1, 2)))
        .mockResolvedValueOnce(
          respuestaHttp({ error: { code: 'EXTERNAL_SERVICE', message: 'Falló TMDB' } }, 502),
        )
        .mockResolvedValueOnce(respuestaHttp(respuestaCartelera([PELICULA_SIN_FECHA], 2, 2))),
    );
    renderRoute('/cartelera');
    await screen.findByRole('link', { name: 'Ver detalle de Dune' });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falló TMDB');
    expect(screen.getByRole('link', { name: 'Ver detalle de Dune' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByRole('link', { name: 'Ver detalle de Título no disponible' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ver detalle de Dune' })).toBeVisible();
  });
});
