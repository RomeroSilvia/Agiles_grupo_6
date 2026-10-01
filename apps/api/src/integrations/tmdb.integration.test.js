import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../config/env.config.js', () => ({
  env: { TMDB_API_KEY: 'clave-prueba' },
}));

import { buscarPeliculas } from './tmdb.integration.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tmdb.integration', () => {
  it('envía la API key v3 como parámetro de consulta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await buscarPeliculas({ q: 'dune', anio: 2021, pagina: 2 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url.searchParams.get('api_key')).toBe('clave-prueba');
    expect(url.searchParams.get('primary_release_year')).toBe('2021');
    expect(url.searchParams.get('page')).toBe('2');
    expect(options.headers).toEqual({ Accept: 'application/json' });
  });
});
