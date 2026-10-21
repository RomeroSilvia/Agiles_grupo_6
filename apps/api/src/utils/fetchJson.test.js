import { describe, it, expect, vi, afterEach } from 'vitest';
import { ExternalServiceError } from '../errors/index.js';
import { fetchJson } from './fetchJson.js';

const URL_PRUEBA = new URL('https://api.ejemplo.com/recurso/1?api_key=secreta');
const OPCIONES = { service: 'Ejemplo', timeoutMs: 1000 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchJson', () => {
  it('devuelve el JSON y envía los headers recibidos junto con Accept', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchJson(URL_PRUEBA, { ...OPCIONES, headers: { 'X-Clave': 'valor' } }),
    ).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(URL_PRUEBA, {
      headers: { Accept: 'application/json', 'X-Clave': 'valor' },
      signal: expect.any(AbortSignal),
    });
  });

  it('convierte una respuesta no exitosa en un error externo con el código HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const error = await fetchJson(URL_PRUEBA, OPCIONES).catch((e) => e);

    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.message).toBe('No se pudo consultar Ejemplo');
    expect(error.cause.status).toBe(503);
  });

  it('no incluye la query (que puede tener claves) en el mensaje de la causa', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const error = await fetchJson(URL_PRUEBA, OPCIONES).catch((e) => e);

    expect(error.cause.message).toBe('HTTP 500 en /recurso/1');
    expect(error.cause.message).not.toContain('secreta');
  });

  it('convierte un fallo de red o un timeout en un error externo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Tiempo agotado')));

    await expect(fetchJson(URL_PRUEBA, OPCIONES)).rejects.toBeInstanceOf(ExternalServiceError);
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

    await expect(fetchJson(URL_PRUEBA, OPCIONES)).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
