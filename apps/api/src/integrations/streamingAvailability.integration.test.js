import { afterEach, describe, expect, it, vi } from 'vitest';

const envMock = vi.hoisted(() => ({ env: { STREAMING_AVAILABILITY_API_KEY: 'clave-prueba' } }));

vi.mock('../config/env.config.js', () => envMock);

import { env } from '../config/env.config.js';
import { ExternalServiceError } from '../errors/index.js';
import { obtenerDeepLinks, obtenerOfertas } from './streamingAvailability.integration.js';

function responder(streamingOptions) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => ({ streamingOptions }) });
}

afterEach(() => {
  vi.unstubAllGlobals();
  env.STREAMING_AVAILABILITY_API_KEY = 'clave-prueba';
});

describe('streamingAvailability.integration', () => {
  it('consulta y valida las ofertas de una película para la región', async () => {
    const ofertas = [
      {
        service: { id: 'netflix' },
        type: 'subscription',
        link: 'https://www.netflix.com/title/1',
      },
    ];
    const fetchMock = responder({ ar: ofertas });
    vi.stubGlobal('fetch', fetchMock);

    await expect(obtenerOfertas({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).resolves.toEqual(
      ofertas,
    );

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url.pathname).toBe('/shows/movie/1');
    expect(url.searchParams.get('country')).toBe('ar');
    expect(opciones.headers).toEqual({
      Accept: 'application/json',
      'X-RapidAPI-Key': 'clave-prueba',
      'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com',
    });
  });

  it('usa la ruta de series y devuelve una lista vacía si no hay ofertas', async () => {
    const fetchMock = responder({ ar: [] });
    vi.stubGlobal('fetch', fetchMock);

    await expect(obtenerOfertas({ tipo: 'serie', tmdbId: 2, region: 'AR' })).resolves.toEqual([]);
    expect(fetchMock.mock.calls[0][0].pathname).toBe('/shows/tv/2');
  });

  it('normaliza las opciones de la región con su tipo de oferta', async () => {
    vi.stubGlobal(
      'fetch',
      responder({
        ar: [
          {
            service: { id: 'netflix' },
            type: 'subscription',
            link: 'https://www.netflix.com/title/1',
          },
          { service: { id: 'prime' }, type: 'rent', link: 'https://www.primevideo.com/detail/1' },
        ],
        us: [{ service: { id: 'hbo' }, type: 'subscription', link: 'https://play.max.com/1' }],
      }),
    );

    await expect(obtenerDeepLinks({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).resolves.toEqual([
      {
        servicio: 'netflix',
        tipoOferta: 'suscripcion',
        deepLink: 'https://www.netflix.com/title/1',
      },
      {
        servicio: 'prime',
        tipoOferta: 'alquiler',
        deepLink: 'https://www.primevideo.com/detail/1',
      },
    ]);
  });

  it('descarta los add-ons, los enlaces inválidos y los tipos desconocidos', async () => {
    vi.stubGlobal(
      'fetch',
      responder({
        ar: [
          { service: { id: 'prime' }, type: 'addon', link: 'https://www.primevideo.com/addon' },
          { service: { id: 'netflix' }, type: 'subscription', link: 'javascript:alert(1)' },
          { service: { id: 'netflix' }, type: 'otro', link: 'https://www.netflix.com/title/1' },
          { service: {}, type: 'subscription', link: 'https://www.netflix.com/title/1' },
        ],
      }),
    );

    await expect(obtenerDeepLinks({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).resolves.toEqual(
      [],
    );
  });

  it.each([
    ['obtenerOfertas', obtenerOfertas],
    ['obtenerDeepLinks', obtenerDeepLinks],
  ])(
    'devuelve una lista vacía si Streaming Availability no conoce el título (%s)',
    async (_, fn) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

      await expect(fn({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).resolves.toEqual([]);
    },
  );

  it.each([
    ['obtenerOfertas', obtenerOfertas],
    ['obtenerDeepLinks', obtenerDeepLinks],
  ])('propaga como error externo un fallo HTTP (%s)', async (_, fn) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    await expect(fn({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).rejects.toBeInstanceOf(
      ExternalServiceError,
    );
  });

  it('rechaza respuestas inválidas al consultar ofertas', async () => {
    vi.stubGlobal('fetch', responder({ ar: 'no' }));

    await expect(
      obtenerOfertas({ tipo: 'pelicula', tmdbId: 1, region: 'AR' }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE', status: 502 });
  });

  it.each([
    ['obtenerOfertas', obtenerOfertas],
    ['obtenerDeepLinks', obtenerDeepLinks],
  ])('no consulta si falta la clave (%s)', async (_, fn) => {
    env.STREAMING_AVAILABILITY_API_KEY = undefined;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fn({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
      status: 502,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
