import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SessionContext } from '../../contexts/session/SessionContext.js';
import { PaginaWatchlist } from './PaginaWatchlist.jsx';

const SESION = { user: { id: 'usuario-1', email: 'ana@example.com' }, loading: false };
const SIN_SESION = { user: null, loading: false };

const DUNE = {
  id: 1,
  agregadoEn: '2026-10-17T12:00:00.000Z',
  titulo: {
    id: 11,
    tmdbId: 101,
    tipo: 'pelicula',
    nombre: 'Dune',
    anio: 2021,
    posterUrl: null,
    puntuacion: 8.1,
  },
};

const MATRIX = {
  id: 2,
  agregadoEn: '2026-10-16T12:00:00.000Z',
  titulo: {
    id: 12,
    tmdbId: 102,
    tipo: 'pelicula',
    nombre: 'Matrix',
    anio: 1999,
    posterUrl: null,
    puntuacion: 8.2,
  },
};

function respuestaLista(resultados) {
  return {
    data: {
      resultados,
      pagina: 1,
      totalResultados: resultados.length,
      totalPaginas: resultados.length ? 1 : 0,
    },
  };
}

function respuestaHttp(data, status = 200) {
  return { ok: true, status, json: async () => data };
}

function renderPagina(sesion = SESION) {
  return render(
    <SessionContext.Provider value={sesion}>
      <MemoryRouter>
        <PaginaWatchlist />
      </MemoryRouter>
    </SessionContext.Provider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PaginaWatchlist', () => {
  it('ofrece iniciar sesión sin consultar la lista privada', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderPagina(SIN_SESION);

    expect(screen.getByRole('heading', { name: 'Tu watchlist' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('muestra el estado vacío cuando la lista no tiene títulos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaHttp(respuestaLista([]))));

    renderPagina();

    expect(
      await screen.findByRole('heading', { name: 'Todavía no agregaste títulos' }),
    ).toBeInTheDocument();
  });

  it('serializa los borrados y actualiza la lista después de cada uno', async () => {
    let titulos = [DUNE, MATRIX];
    let terminarBorradoDeDune;
    const fetchMock = vi.fn((input, options = {}) => {
      const url = new URL(input.toString());
      if (url.pathname === '/api/watchlist' && options.method !== 'DELETE') {
        return Promise.resolve(respuestaHttp(respuestaLista(titulos)));
      }
      if (url.pathname === '/api/watchlist/pelicula/101' && options.method === 'DELETE') {
        return new Promise((resolve) => {
          terminarBorradoDeDune = resolve;
        });
      }
      if (url.pathname === '/api/watchlist/pelicula/102' && options.method === 'DELETE') {
        titulos = [];
        return Promise.resolve(respuestaHttp(null, 204));
      }
      throw new Error(`Solicitud inesperada: ${options.method} ${url.pathname}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPagina();

    const quitarDune = await screen.findByRole('button', { name: 'Quitar Dune de la watchlist' });
    const quitarMatrix = screen.getByRole('button', { name: 'Quitar Matrix de la watchlist' });
    fireEvent.click(quitarDune);

    await waitFor(() => expect(terminarBorradoDeDune).toBeDefined());
    expect(quitarMatrix).toBeDisabled();
    expect(
      fetchMock.mock.calls.some(
        ([input, options]) =>
          new URL(input.toString()).pathname === '/api/watchlist/pelicula/102' &&
          options.method === 'DELETE',
      ),
    ).toBe(false);

    titulos = [MATRIX];
    await act(async () => {
      terminarBorradoDeDune(respuestaHttp(null, 204));
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Quitar Dune de la watchlist' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Quitar Matrix de la watchlist' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Quitar Matrix de la watchlist' }));

    expect(
      await screen.findByRole('heading', { name: 'Todavía no agregaste títulos' }),
    ).toBeInTheDocument();
  });

  it('recarga solo la primera página después de quitar un título de una página posterior', async () => {
    const primeraPaginaInicial = {
      ...respuestaLista([DUNE]),
      data: { ...respuestaLista([DUNE]).data, pagina: 1, totalPaginas: 2, totalResultados: 21 },
    };
    const primeraPaginaActualizada = {
      ...respuestaLista([DUNE]),
      data: { ...respuestaLista([DUNE]).data, pagina: 1, totalPaginas: 1, totalResultados: 20 },
    };
    const paginaDos = {
      data: {
        resultados: [MATRIX],
        pagina: 2,
        totalResultados: 21,
        totalPaginas: 2,
      },
    };
    let quitado = false;
    const solicitudesLista = [];
    const fetchMock = vi.fn((input, options = {}) => {
      const url = new URL(input.toString());
      if (url.pathname === '/api/watchlist' && options.method !== 'DELETE') {
        const pagina = Number(url.searchParams.get('pagina'));
        solicitudesLista.push(pagina);
        let respuesta = paginaDos;
        if (pagina === 1) {
          respuesta = quitado ? primeraPaginaActualizada : primeraPaginaInicial;
        }
        return Promise.resolve(respuestaHttp(respuesta));
      }
      if (url.pathname === '/api/watchlist/pelicula/102' && options.method === 'DELETE') {
        quitado = true;
        return Promise.resolve(respuestaHttp(null, 204));
      }
      throw new Error(`Solicitud inesperada: ${options.method} ${url.pathname}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPagina();
    await screen.findByRole('heading', { name: 'Dune' });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Quitar Matrix de la watchlist' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Quitar Matrix de la watchlist' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Cargar más' })).toBeNull();
    });
    expect(solicitudesLista).toEqual([1, 2, 1]);
  });

  it('conserva el estado persistido e informa si falla quitar un título', async () => {
    const fetchMock = vi.fn((input, options = {}) => {
      const url = new URL(input.toString());
      if (url.pathname === '/api/watchlist' && options.method !== 'DELETE') {
        return Promise.resolve(respuestaHttp(respuestaLista([DUNE])));
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({
          error: { code: 'DATABASE', message: 'No se pudo quitar el título' },
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPagina();
    fireEvent.click(await screen.findByRole('button', { name: 'Quitar Dune de la watchlist' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo quitar el título');
    expect(screen.getByRole('button', { name: 'Quitar Dune de la watchlist' })).toBeEnabled();
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
  });
});
