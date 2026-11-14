import { afterEach, describe, expect, it, vi } from 'vitest';
import { listarCandidatosEstrenos, obtenerFechasEstrenoArgentina } from './tmdb.integration.js';

vi.mock('../config/env.config.js', () => ({ env: { TMDB_API_KEY: 'clave-ficticia' } }));
afterEach(() => vi.unstubAllGlobals());
describe('TMDB para próximos estrenos', () => {
  it('rechaza una última página vacía si la fuente anunció candidatos pendientes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ page: 1, results: [], total_results: 2, total_pages: 1 }),
      }),
    );
    await expect(
      listarCandidatosEstrenos({
        origen: 'discover',
        desde: '2027-01-02',
        hasta: '2027-01-30',
        pagina: 1,
      }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
  });
  it('consulta Upcoming AR y Discover con fechas teatrales, sin cambiar búsqueda', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        page: 1,
        results: [],
        total_results: 0,
        total_pages: 0,
        dates: { minimum: '2027-01-01', maximum: '2027-02-01' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    for (const origen of ['upcoming', 'discover']) {
      await listarCandidatosEstrenos({
        origen,
        desde: '2027-01-02',
        hasta: '2027-01-30',
        pagina: 1,
      });
    }
    const [upcoming, discover] = fetchMock.mock.calls.map(([url]) => url);
    expect(upcoming.pathname).toBe('/3/movie/upcoming');
    expect(upcoming.searchParams.get('region')).toBe('AR');
    expect(discover.pathname).toBe('/3/discover/movie');
    expect(Object.fromEntries(discover.searchParams)).toMatchObject({
      with_release_type: '2|3',
      'release_date.gte': '2027-01-02',
      'release_date.lte': '2027-01-30',
      include_adult: 'false',
      include_video: 'false',
      language: 'es-AR',
    });
  });
  it('excluye mundial y digital y conserva todas las fechas teatrales argentinas ordenadas', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { iso_3166_1: 'US', release_dates: [{ type: 3, release_date: '2027-01-01' }] },
          {
            iso_3166_1: 'AR',
            release_dates: [
              { type: 4, release_date: '2027-01-02' },
              { type: 3, release_date: '2027-02-02' },
              { type: 2, release_date: '2027-01-08' },
            ],
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    expect((await obtenerFechasEstrenoArgentina({ tmdbId: 8976 })).fechas).toEqual([
      '2027-01-08',
      '2027-02-02',
    ]);
    await obtenerFechasEstrenoArgentina({ tmdbId: 8976 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('rechaza una ventana ausente en Upcoming', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ page: 1, results: [], total_results: 0, total_pages: 0 }),
      }),
    );
    await expect(
      listarCandidatosEstrenos({
        origen: 'upcoming',
        desde: '2027-01-02',
        hasta: '2027-01-30',
        pagina: 1,
      }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
  });
});
