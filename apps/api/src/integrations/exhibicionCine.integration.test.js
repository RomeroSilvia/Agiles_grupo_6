import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../config/env.config.js', () => ({ env: { TMDB_API_KEY: 'clave-ficticia' } }));
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());
const response = (body) => ({ ok: true, json: async () => body });
describe('adquisición de fechas e índice de exhibición', () => {
  it('obtiene año y fechas en una llamada compartida entre cartelera y estrenos', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url) =>
      response(
        url.pathname.endsWith('/now_playing')
          ? { page: 1, results: [{ id: 77 }], total_pages: 1, total_results: 1 }
          : {
              id: 77,
              release_date: '1999-01-01',
              release_dates: {
                results: [
                  { iso_3166_1: 'AR', release_dates: [{ type: 3, release_date: '2026-11-15' }] },
                ],
              },
            },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const tmdb = await import('./tmdb.integration.js');
    const cartelera = await tmdb.listarPeliculasEnCartelera({ pagina: 1 });
    const fechas = await tmdb.obtenerFechasEstrenoArgentina({ tmdbId: 77 });
    expect(cartelera.resultados[0].anio).toBe(1999);
    expect(fechas).toMatchObject({ anio: 1999, fechas: ['2026-11-15'] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0].searchParams.get('append_to_response')).toBe('release_dates');
  });
  it('conserva una película con año null ante un 404 puntual', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({ page: 1, results: [{ id: 77 }, { id: 78 }], total_pages: 1, total_results: 2 }),
      )
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce(
        response({ id: 78, release_date: '2026-01-01', release_dates: { results: [] } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const tmdb = await import('./tmdb.integration.js');
    const cartelera = await tmdb.listarPeliculasEnCartelera({ pagina: 1 });
    expect(cartelera.resultados.map(({ anio }) => anio)).toEqual([null, 2026]);
    expect(await tmdb.obtenerFechasEstrenoArgentina({ tmdbId: 77 })).toMatchObject({
      anio: null,
      fechas: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('adquiere todas las páginas del índice y comparte la caché', async () => {
    const ids = Array.from({ length: 21 }, (_, i) => i + 1);
    const fetchMock = vi.fn().mockImplementation(async (url) =>
      response({
        page: Number(url.searchParams.get('page')),
        total_pages: 2,
        total_results: 21,
        results: ids
          .slice(
            (Number(url.searchParams.get('page')) - 1) * 20,
            Number(url.searchParams.get('page')) * 20,
          )
          .map((id) => ({ id })),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { listarIdsPeliculasEnCartelera } = await import('./tmdb.integration.js');
    expect(await listarIdsPeliculasEnCartelera()).toEqual(ids);
    expect(await listarIdsPeliculasEnCartelera()).toEqual(ids);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('no cachea un índice incompleto ni publica un subconjunto', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ page: 1, total_pages: 2, total_results: 21, results: [] }))
      .mockResolvedValueOnce(
        response({ page: 1, total_pages: 1, total_results: 1, results: [{ id: 77 }] }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { listarIdsPeliculasEnCartelera } = await import('./tmdb.integration.js');
    await expect(listarIdsPeliculasEnCartelera()).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
    });
    expect(await listarIdsPeliculasEnCartelera()).toEqual([77]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it.each([
    ['vacía', []],
    ['parcial', [{ id: 21 }]],
    ['repetida', [{ id: 1 }, { id: 22 }]],
  ])(
    'rechaza una última página %s y vuelve a adquirir el índice completo al reintentar',
    async (_caso, ultimaPagina) => {
      const primera = {
        page: 1,
        total_pages: 2,
        total_results: 22,
        results: Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })),
      };
      const segunda = {
        page: 2,
        total_pages: 2,
        total_results: 22,
        results: [{ id: 21 }, { id: 22 }],
      };
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(response(primera))
        .mockResolvedValueOnce(response({ ...segunda, results: ultimaPagina }))
        .mockResolvedValueOnce(response(primera))
        .mockResolvedValueOnce(response(segunda));
      vi.stubGlobal('fetch', fetchMock);
      const { listarIdsPeliculasEnCartelera } = await import('./tmdb.integration.js');
      await expect(listarIdsPeliculasEnCartelera()).rejects.toMatchObject({
        code: 'EXTERNAL_SERVICE',
      });
      const ids = await listarIdsPeliculasEnCartelera();
      expect(ids).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
      expect(await listarIdsPeliculasEnCartelera()).toEqual(ids);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    },
  );
  it('acepta y cachea un índice vacío confirmado', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ page: 1, total_pages: 0, total_results: 0, results: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const { listarIdsPeliculasEnCartelera } = await import('./tmdb.integration.js');
    expect(await listarIdsPeliculasEnCartelera()).toEqual([]);
    expect(await listarIdsPeliculasEnCartelera()).toEqual([]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
