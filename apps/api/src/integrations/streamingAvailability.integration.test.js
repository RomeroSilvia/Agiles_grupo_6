import { afterEach, describe, expect, it, vi } from 'vitest';

const envMock = vi.hoisted(() => ({ env: { STREAMING_AVAILABILITY_API_KEY: 'clave-prueba' } }));

vi.mock('../config/env.config.js', () => envMock);

import { env } from '../config/env.config.js';
import { obtenerOfertas } from './streamingAvailability.integration.js';

afterEach(() => {
  vi.unstubAllGlobals();
  env.STREAMING_AVAILABILITY_API_KEY = 'clave-prueba';
});

describe('streamingAvailability.integration', () => {
  it('consulta y valida las ofertas de una película para una región', async () => {
    const ofertas = [
      {
        service: { id: 'netflix' },
        type: 'subscription',
        link: 'https://www.netflix.com/title/1',
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ streamingOptions: { ar: ofertas } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(obtenerOfertas({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).resolves.toEqual(
      ofertas,
    );

    const [url, options] = fetchMock.mock.calls[0];
    expect(url.pathname).toBe('/shows/movie/1');
    expect(url.searchParams.get('country')).toBe('ar');
    expect(options.headers).toEqual({
      Accept: 'application/json',
      'X-RapidAPI-Key': 'clave-prueba',
      'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com',
    });
  });

  it('usa la ruta de series y devuelve una lista vacía cuando no hay ofertas', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ streamingOptions: { ar: [] } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(obtenerOfertas({ tipo: 'serie', tmdbId: 2, region: 'AR' })).resolves.toEqual([]);
    expect(fetchMock.mock.calls[0][0].pathname).toBe('/shows/tv/2');
  });

  it('no hace solicitudes si falta la clave', async () => {
    env.STREAMING_AVAILABILITY_API_KEY = undefined;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      obtenerOfertas({ tipo: 'pelicula', tmdbId: 1, region: 'AR' }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE', status: 502 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('convierte errores HTTP y respuestas inválidas en errores externos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(
      obtenerOfertas({ tipo: 'pelicula', tmdbId: 1, region: 'AR' }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE', status: 502 });

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ streamingOptions: { ar: 'no' } }) }),
    );
    await expect(
      obtenerOfertas({ tipo: 'pelicula', tmdbId: 1, region: 'AR' }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE', status: 502 });
  });
});
