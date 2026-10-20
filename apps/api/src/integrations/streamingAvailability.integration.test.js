import { describe, it, expect, vi, afterEach } from 'vitest';

const envMock = vi.hoisted(() => ({ env: { STREAMING_AVAILABILITY_API_KEY: 'clave-prueba' } }));

vi.mock('../config/env.config.js', () => envMock);

import { env } from '../config/env.config.js';
import { obtenerDeepLinks } from './streamingAvailability.integration.js';

function responder(streamingOptions) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => ({ streamingOptions }) });
}

afterEach(() => {
  vi.unstubAllGlobals();
  env.STREAMING_AVAILABILITY_API_KEY = 'clave-prueba';
});

describe('obtenerDeepLinks', () => {
  it('consulta el título por su id de TMDB y la región, con las credenciales de RapidAPI', async () => {
    const fetchMock = responder({});
    vi.stubGlobal('fetch', fetchMock);

    await obtenerDeepLinks({ tipo: 'serie', tmdbId: 1399, region: 'AR' });

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url.pathname).toBe('/shows/tv/1399');
    expect(url.searchParams.get('country')).toBe('ar');
    expect(opciones.headers).toMatchObject({
      'X-RapidAPI-Key': 'clave-prueba',
      'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com',
    });
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

  it('descarta los add-ons y conserva la suscripción del mismo servicio', async () => {
    vi.stubGlobal(
      'fetch',
      responder({
        ar: [
          { service: { id: 'prime' }, type: 'addon', link: 'https://www.primevideo.com/addon' },
          { service: { id: 'prime' }, type: 'subscription', link: 'https://www.primevideo.com/1' },
        ],
      }),
    );

    await expect(obtenerDeepLinks({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).resolves.toEqual([
      { servicio: 'prime', tipoOferta: 'suscripcion', deepLink: 'https://www.primevideo.com/1' },
    ]);
  });

  it('descarta enlaces con un protocolo que no es http(s), mal formados o de tipo desconocido', async () => {
    vi.stubGlobal(
      'fetch',
      responder({
        ar: [
          { service: { id: 'netflix' }, type: 'subscription', link: 'javascript:alert(1)' },
          { service: { id: 'netflix' }, type: 'subscription', link: 'no es un enlace' },
          { service: { id: 'netflix' }, type: 'otro', link: 'https://www.netflix.com/title/1' },
          { service: {}, type: 'subscription', link: 'https://www.netflix.com/title/1' },
        ],
      }),
    );

    await expect(obtenerDeepLinks({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).resolves.toEqual(
      [],
    );
  });

  it('devuelve una lista vacía si el título no tiene opciones en la región', async () => {
    vi.stubGlobal('fetch', responder({ us: [] }));

    await expect(obtenerDeepLinks({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).resolves.toEqual(
      [],
    );
  });

  it('devuelve una lista vacía si Streaming Availability no conoce el título', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(obtenerDeepLinks({ tipo: 'pelicula', tmdbId: 1, region: 'AR' })).resolves.toEqual(
      [],
    );
  });

  it('lanza un error externo si se agotó el límite de requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    await expect(
      obtenerDeepLinks({ tipo: 'pelicula', tmdbId: 1, region: 'AR' }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE', status: 502 });
  });

  it('lanza un error externo sin consultar si falta la clave', async () => {
    env.STREAMING_AVAILABILITY_API_KEY = undefined;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      obtenerDeepLinks({ tipo: 'pelicula', tmdbId: 1, region: 'AR' }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
