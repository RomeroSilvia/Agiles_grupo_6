import { describe, it, expect, vi, afterEach } from 'vitest';

const envMock = vi.hoisted(() => ({ env: { TMDB_API_KEY: 'clave-prueba' } }));

vi.mock('../config/env.config.js', () => envMock);

import {
  buscarPeliculas,
  buscarSeries,
  obtenerPelicula,
  obtenerSerie,
} from './tmdb.integration.js';
import { env } from '../config/env.config.js';

afterEach(() => {
  vi.unstubAllGlobals();
  env.TMDB_API_KEY = 'clave-prueba';
});

describe('tmdb.integration', () => {
  it('consulta y normaliza el detalle de una película', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        title: 'Dune',
        overview: 'En un futuro lejano...',
        release_date: '2021-10-22',
        poster_path: '/dune.jpg',
        vote_average: 8.1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const respuesta = await obtenerPelicula(1);
    const [url] = fetchMock.mock.calls[0];

    expect(url.pathname).toBe('/3/movie/1');
    expect(url.searchParams.get('language')).toBe('es-AR');
    expect(respuesta).toEqual({
      tmdbId: 1,
      tipo: 'pelicula',
      nombre: 'Dune',
      sinopsis: 'En un futuro lejano...',
      posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
      anio: 2021,
      puntuacion: 8.1,
    });
  });

  it('consulta y normaliza el detalle de una serie', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 2,
        name: 'The Office',
        overview: 'Una comedia de oficina.',
        first_air_date: '2005-03-24',
        poster_path: '/office.jpg',
        vote_average: 8.6,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const respuesta = await obtenerSerie(2);
    const [url] = fetchMock.mock.calls[0];

    expect(url.pathname).toBe('/3/tv/2');
    expect(url.searchParams.get('language')).toBe('es-AR');
    expect(respuesta).toMatchObject({
      tmdbId: 2,
      tipo: 'serie',
      nombre: 'The Office',
      sinopsis: 'Una comedia de oficina.',
      anio: 2005,
      puntuacion: 8.6,
    });
  });

  it('devuelve null para los campos faltantes del detalle', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 3 }),
      }),
    );

    await expect(obtenerPelicula(3)).resolves.toEqual({
      tmdbId: 3,
      tipo: 'pelicula',
      nombre: null,
      sinopsis: null,
      posterUrl: null,
      anio: null,
      puntuacion: null,
    });
  });

  it('convierte un error del endpoint de detalle en un error externo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(obtenerSerie(999)).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
      status: 502,
    });
  });

  it('envía la API key v3 como parámetro de consulta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        page: 2,
        results: [
          {
            id: 1,
            title: 'Dune',
            release_date: '2021-10-22',
            poster_path: '/dune.jpg',
            vote_average: 8.1,
            popularity: 100,
          },
        ],
        total_results: 1,
        total_pages: 2,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const respuesta = await buscarPeliculas({ q: 'dune', anio: 2021, pagina: 2 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url.searchParams.get('api_key')).toBe('clave-prueba');
    expect(url.searchParams.get('primary_release_year')).toBe('2021');
    expect(url.searchParams.get('year')).toBeNull();
    expect(url.searchParams.get('page')).toBe('2');
    expect(options.headers).toEqual({ Accept: 'application/json' });
    expect(respuesta.resultados[0]).toMatchObject({
      tmdbId: 1,
      posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
    });
    expect(respuesta.resultados[0]).not.toHaveProperty('posterPath');
  });

  it('envía solo el filtro de fecha propio de series', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await buscarSeries({ q: 'dune', anio: 2021, pagina: 1 });

    const [url] = fetchMock.mock.calls[0];
    expect(url.searchParams.get('first_air_date_year')).toBe('2021');
    expect(url.searchParams.get('year')).toBeNull();
  });

  it('convierte una respuesta no exitosa en un error externo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(buscarPeliculas({ q: 'dune', pagina: 1 })).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
      status: 502,
    });
  });

  it('convierte un JSON inválido en un error externo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('JSON inválido');
        },
      }),
    );

    await expect(buscarPeliculas({ q: 'dune', pagina: 1 })).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
      status: 502,
    });
  });

  it('convierte un timeout en un error externo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Tiempo agotado')));

    await expect(buscarPeliculas({ q: 'dune', pagina: 1 })).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
      status: 502,
    });
  });

  it('responde con un error externo si falta la clave', async () => {
    env.TMDB_API_KEY = undefined;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(buscarPeliculas({ q: 'dune', pagina: 1 })).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
      status: 502,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
