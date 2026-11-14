import { afterEach, describe, expect, it, vi } from 'vitest';
import { TIPO_TITULO } from '@buscador/shared/constants';

const envMock = vi.hoisted(() => ({ env: { TMDB_API_KEY: 'clave-prueba' } }));

vi.mock('../config/env.config.js', () => envMock);

import {
  buscarPersonas,
  buscarTitulosPorTexto,
  descubrirTitulos,
  listarPeliculasEnCartelera,
  listarGenerosPorTipo,
  obtenerCreditosCombinados,
  obtenerCreditosPersona,
  obtenerDetalle,
  obtenerOfertas,
  obtenerPersona,
  obtenerFechaEstrenoArgentina,
} from './tmdb.integration.js';
import { env } from '../config/env.config.js';

afterEach(() => {
  vi.unstubAllGlobals();
  env.TMDB_API_KEY = 'clave-prueba';
});

function respuestaFetch(body) {
  return { ok: true, json: async () => body };
}

describe('llamadas de búsqueda a TMDB', () => {
  it('normaliza una búsqueda de películas y envía el año específico', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respuestaFetch({
        page: 2,
        results: [
          {
            id: 1,
            title: 'Dune',
            genre_ids: [878],
            release_date: '2021-10-22',
            poster_path: '/dune.jpg',
            vote_average: 8.1,
            popularity: 100,
          },
        ],
        total_results: 1,
        total_pages: 2,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const respuesta = await buscarTitulosPorTexto({
      tipo: TIPO_TITULO.PELICULA,
      q: 'dune transporte',
      anio: 2021,
      pagina: 2,
    });
    const [url] = fetchMock.mock.calls[0];

    expect(url.pathname).toBe('/3/search/movie');
    expect(url.searchParams.get('query')).toBe('dune transporte');
    expect(url.searchParams.get('primary_release_year')).toBe('2021');
    expect(url.searchParams.get('year')).toBeNull();
    expect(respuesta.resultados[0]).toMatchObject({
      tmdbId: 1,
      tipo: 'pelicula',
      nombre: 'Dune',
      generoIds: [878],
      fecha: '2021-10-22',
      posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
      puntuacion: 8.1,
      relevancia: 100,
    });
  });

  it('envía los IDs equivalentes de género como alternativas en discover', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respuestaFetch({
        page: 1,
        results: [],
        total_results: 0,
        total_pages: 0,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await descubrirTitulos({
      tipo: TIPO_TITULO.PELICULA,
      generoIds: [28, 12],
      pagina: 1,
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url.pathname).toBe('/3/discover/movie');
    expect(url.searchParams.get('with_genres')).toBe('28|12');
    expect(url.searchParams.has('query')).toBe(false);
  });

  it('normaliza personas, créditos y géneros sin elegir roles en la integración', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        respuestaFetch({
          total_pages: 1,
          results: [
            {
              id: 6193,
              name: 'Leonardo DiCaprio',
              profile_path: '/leo.jpg',
              known_for_department: 'Acting',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        respuestaFetch({
          cast: [
            {
              id: 1,
              title: 'Película',
              genre_ids: [18],
              release_date: '2021-01-01',
              popularity: 8,
            },
          ],
          crew: [],
        }),
      )
      .mockResolvedValueOnce(
        respuestaFetch({ cast: [{ id: 1 }], crew: [{ id: 2, job: 'Director' }] }),
      )
      .mockResolvedValueOnce(respuestaFetch({ genres: [{ id: 18, name: 'Drama' }] }))
      .mockResolvedValueOnce(
        respuestaFetch({
          id: 6193,
          name: 'Leonardo DiCaprio',
          profile_path: '/leo.jpg',
          known_for_department: 'Acting',
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(buscarPersonas({ q: 'Leo único', pagina: 1 })).resolves.toMatchObject({
      resultados: [
        {
          id: 6193,
          nombre: 'Leonardo DiCaprio',
          fotoUrl: 'https://image.tmdb.org/t/p/w185/leo.jpg',
          departamentoConocido: 'Acting',
        },
      ],
      totalPaginas: 1,
    });
    await expect(
      obtenerCreditosPersona({ personaId: 6193, tipo: TIPO_TITULO.PELICULA }),
    ).resolves.toMatchObject({ cast: [{ tmdbId: 1, puesto: undefined }], crew: [] });
    await expect(obtenerCreditosCombinados({ personaId: 6193 })).resolves.toEqual({
      cast: [{ id: 1 }],
      crew: [{ id: 2, job: 'Director' }],
    });
    await expect(listarGenerosPorTipo(TIPO_TITULO.PELICULA)).resolves.toEqual([
      { id: 18, nombre: 'Drama' },
    ]);
    await expect(obtenerPersona({ personaId: 6193 })).resolves.toMatchObject({
      id: 6193,
      nombre: 'Leonardo DiCaprio',
    });
    expect(fetchMock.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
      '/3/search/person',
      '/3/person/6193/movie_credits',
      '/3/person/6193/combined_credits',
      '/3/genre/movie/list',
      '/3/person/6193',
    ]);
  });

  it('convierte errores HTTP y respuestas JSON inválidas en errores externos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(
      buscarTitulosPorTexto({ tipo: TIPO_TITULO.PELICULA, q: 'error 503', pagina: 1 }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE', status: 502 });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('JSON inválido');
        },
      }),
    );
    await expect(
      buscarTitulosPorTexto({ tipo: TIPO_TITULO.PELICULA, q: 'error json', pagina: 1 }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE', status: 502 });
  });

  it('falla si no está configurada la clave de TMDB', async () => {
    env.TMDB_API_KEY = undefined;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      buscarTitulosPorTexto({ tipo: TIPO_TITULO.PELICULA, q: 'sin clave', pagina: 1 }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE', status: 502 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('detalle y disponibilidad de TMDB', () => {
  it('normaliza el detalle de una película', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respuestaFetch({
        id: 1,
        title: 'Dune',
        overview: 'En un futuro lejano...',
        release_date: '2021-10-22',
        poster_path: '/dune.jpg',
        vote_average: 8.1,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(obtenerDetalle(TIPO_TITULO.PELICULA, 1)).resolves.toEqual({
      tmdbId: 1,
      tipo: 'pelicula',
      nombre: 'Dune',
      sinopsis: 'En un futuro lejano...',
      posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
      anio: 2021,
      puntuacion: 8.1,
    });
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/3/movie/1');
  });

  it('convierte un 404 del endpoint de detalle en un recurso no encontrado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(obtenerDetalle(TIPO_TITULO.SERIE, 999)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  describe('cartelera y fechas de estreno de TMDB', () => {
    it('consulta cartelera argentina, normaliza películas y conserva la caché por página', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        respuestaFetch({
          page: 1,
          results: [
            {
              id: 21,
              title: 'Película',
              release_date: '2026-03-04',
              poster_path: '/poster.jpg',
              vote_average: 7.5,
            },
          ],
          total_results: 1,
          total_pages: 1,
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const primera = await listarPeliculasEnCartelera({ pagina: 1 });
      const segunda = await listarPeliculasEnCartelera({ pagina: 1 });
      const [url] = fetchMock.mock.calls[0];

      expect(url.pathname).toBe('/3/movie/now_playing');
      expect(url.searchParams.get('region')).toBe('AR');
      expect(url.searchParams.get('language')).toBe('es-AR');
      expect(url.searchParams.get('page')).toBe('1');
      expect(primera).toMatchObject({
        resultados: [
          {
            tmdbId: 21,
            tipo: 'pelicula',
            nombre: 'Película',
            anio: 2026,
            posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
            puntuacion: 7.5,
          },
        ],
        pagina: 1,
        totalResultados: 1,
        totalPaginas: 1,
      });
      expect(segunda.consultadoEn).toBe(primera.consultadoEn);
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it.each([
      ['resultados inválidos', 4, { results: 'inválido' }],
      ['identidad inválida', 5, { results: [{ id: 0 }] }],
      ['paginación inválida', 6, { total_pages: -1 }],
    ])(
      'permite reintentar tras %s y cachea la respuesta recuperada',
      async (_caso, pagina, datosInvalidos) => {
        const respuestaValida = {
          page: pagina,
          results: [],
          total_results: 0,
          total_pages: 0,
        };
        const fetchMock = vi
          .fn()
          .mockResolvedValueOnce(respuestaFetch({ ...respuestaValida, ...datosInvalidos }))
          .mockResolvedValueOnce(respuestaFetch(respuestaValida));
        vi.stubGlobal('fetch', fetchMock);

        await expect(listarPeliculasEnCartelera({ pagina })).rejects.toMatchObject({
          code: 'EXTERNAL_SERVICE',
          status: 502,
        });

        const recuperada = await listarPeliculasEnCartelera({ pagina });
        expect(recuperada).toMatchObject({
          resultados: [],
          pagina,
          totalResultados: 0,
          totalPaginas: 0,
        });
        await expect(listarPeliculasEnCartelera({ pagina })).resolves.toEqual(recuperada);
        expect(fetchMock).toHaveBeenCalledTimes(2);
      },
    );

    it('selecciona la primera fecha argentina de tipo 2 o 3 sin cambiar el día civil', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        respuestaFetch({
          results: [
            {
              iso_3166_1: 'US',
              release_dates: [{ release_date: '2026-01-01', type: 3 }],
            },
            {
              iso_3166_1: 'AR',
              release_dates: [
                { release_date: '2026-06-08', type: 1 },
                { release_date: '2026-06-09T00:00:00.000Z', type: 2 },
                { release_date: '2026-06-10', type: 3 },
                { release_date: '2026-06-11', type: 4 },
              ],
            },
          ],
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      const primera = await obtenerFechaEstrenoArgentina({ tmdbId: 321 });
      const segunda = await obtenerFechaEstrenoArgentina({ tmdbId: 321 });

      expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/3/movie/321/release_dates');
      expect(primera.fechaEstrenoAr).toBe('2026-06-09');
      expect(segunda.consultadoEn).toBe(primera.consultadoEn);
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('falla ante respuestas inválidas del endpoint de fechas y errores HTTP 429', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaFetch({ results: 'inválido' })));
      await expect(obtenerFechaEstrenoArgentina({ tmdbId: 654 })).rejects.toMatchObject({
        code: 'EXTERNAL_SERVICE',
        status: 502,
      });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          respuestaFetch({
            results: [
              {
                iso_3166_1: 'AR',
                release_dates: [{ release_date: '2026-02-31', type: 3 }],
              },
            ],
          }),
        ),
      );
      await expect(obtenerFechaEstrenoArgentina({ tmdbId: 655 })).rejects.toMatchObject({
        code: 'EXTERNAL_SERVICE',
        status: 502,
      });

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
      await expect(listarPeliculasEnCartelera({ pagina: 2 })).rejects.toMatchObject({
        code: 'EXTERNAL_SERVICE',
        status: 502,
      });

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
      await expect(listarPeliculasEnCartelera({ pagina: 3 })).rejects.toMatchObject({
        code: 'EXTERNAL_SERVICE',
        status: 502,
        cause: { status: 429 },
      });
    });
  });

  it('agrupa ofertas regionales y usa la caché para el mismo título', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respuestaFetch({
        results: {
          AR: {
            link: 'https://www.themoviedb.org/movie/7/watch',
            flatrate: [{ provider_id: 8, logo_path: '/netflix.jpg' }],
          },
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const primera = await obtenerOfertas({ tipo: TIPO_TITULO.PELICULA, tmdbId: 7 });
    const segunda = await obtenerOfertas({ tipo: TIPO_TITULO.PELICULA, tmdbId: 7 });

    expect(primera.AR.ofertas).toEqual([
      { tmdbProviderId: 8, tipoOferta: 'suscripcion', logoPath: '/netflix.jpg' },
    ]);
    expect(segunda).toEqual(primera);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
