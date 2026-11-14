import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CIUDAD_CINE_FIXTURE } from '@buscador/shared/testing';

vi.mock('../config/env.config.js', () => ({ env: { SERPAPI_API_KEY: 'clave-ficticia-privada' } }));
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-14T12:00:00Z');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const parametros = {
  pelicula: { tmdbId: 77, nombre: 'Película de prueba' },
  ciudad: {
    ...CIUDAD_CINE_FIXTURE,
    serpApiLocation: 'Ciudad,Argentina',
    evidenciaPorFuente: { serpApi: { evidencia: 'prueba' } },
  },
  desde: '2026-11-14',
  hasta: '2026-11-21',
};
describe('SerpApi de lectura', () => {
  it('no declara incompleto un objeto que ni siquiera acredita éxito y no consulta una película sin nombre', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ datoDesconocido: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const { obtenerFuncionesSerpApi } = await import('./serpApi.integration.js');
    await expect(obtenerFuncionesSerpApi(parametros)).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
    });
    await expect(
      obtenerFuncionesSerpApi({ ...parametros, pelicula: { tmdbId: 78, nombre: null } }),
    ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('construye parámetros privados y comparte promesas sin extraer snippets como funciones', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        search_metadata: { status: 'Success' },
        organic_results: [{ snippet: '20:00' }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { obtenerFuncionesSerpApi } = await import('./serpApi.integration.js');
    const respuestas = await Promise.all([
      obtenerFuncionesSerpApi(parametros),
      obtenerFuncionesSerpApi(parametros),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0];
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      engine: 'google',
      gl: 'ar',
      hl: 'es',
      location: 'Ciudad,Argentina',
      api_key: 'clave-ficticia-privada',
    });
    expect(url.searchParams.has('no_cache')).toBe(false);
    expect(respuestas[0]).toMatchObject({ estadoFuente: 'incompleta', funciones: [] });
    expect(JSON.stringify(respuestas)).not.toContain('clave-ficticia');
  });
  it('mantiene vacío estructurado separado de estructura ausente', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ search_metadata: { status: 'Success' }, showtimes: [] }),
      }),
    );
    const { obtenerFuncionesSerpApi } = await import('./serpApi.integration.js');
    expect((await obtenerFuncionesSerpApi(parametros)).estadoFuente).toBe('disponible');
  });
  it('detiene nuevas consultas tras 429 y no conserva URLs autenticadas en errores', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    vi.stubGlobal('fetch', fetchMock);
    const { obtenerFuncionesSerpApi } = await import('./serpApi.integration.js');
    for (const tmdbId of [77, 78])
      await expect(
        obtenerFuncionesSerpApi({ ...parametros, pelicula: { ...parametros.pelicula, tmdbId } }),
      ).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE', cause: { quota: true } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('transforma HTML y JSON inválido en error externo sin filtrar secretos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('url?api_key=clave-ficticia-privada');
        },
      }),
    );
    const { obtenerFuncionesSerpApi } = await import('./serpApi.integration.js');
    try {
      await obtenerFuncionesSerpApi(parametros);
      expect.fail('Debía fallar');
    } catch (error) {
      expect(error.code).toBe('EXTERNAL_SERVICE');
      expect(error.cause.message).not.toContain('clave-ficticia');
    }
  });
});
