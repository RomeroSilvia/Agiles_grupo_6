import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CIUDAD_CINE_FIXTURE } from '@buscador/shared/testing';

const config = vi.hoisted(() => ({ correspondencias: [], lugares: [] }));
vi.mock('../config/env.config.js', () => ({ env: { SERPAPI_API_KEY: 'clave-ficticia-privada' } }));
vi.mock('../config/funcionesCine.config.js', async (importOriginal) => ({
  ...(await importOriginal()),
  get CORRESPONDENCIAS_PELICULAS_CINE() {
    return config.correspondencias;
  },
  get LUGARES_CINE() {
    return config.lugares;
  },
}));
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-14T12:00:00Z');
  config.correspondencias = [77, 78].map((tmdbId) => ({
    fuenteId: 'serpapi',
    registroId: `/m/pelicula-${tmdbId}`,
    nombre: tmdbId === 77 ? 'Película de prueba' : 'Otra película',
    tmdbId,
    evidencia: 'Identidad revisada en fixture',
  }));
  config.lugares = [
    {
      clave: 'central',
      ciudadId: CIUDAD_CINE_FIXTURE.id,
      nombre: 'Cine Central',
      direccion: 'Calle 123',
      evidencia: 'Municipio revisado en fixture',
      fuentes: [
        { fuenteId: 'serpapi', registroId: null, nombre: 'Cine Central', direccion: 'Calle 123' },
      ],
    },
  ];
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
  it.each([
    [
      'sin correspondencias',
      () => {
        config.correspondencias = [];
      },
    ],
    [
      'con películas solo de Butaca',
      () => {
        config.correspondencias.forEach((item) => {
          item.fuenteId = 'butaca';
        });
      },
    ],
    [
      'con otra película',
      () => {
        config.correspondencias = config.correspondencias.filter((item) => item.tmdbId !== 77);
      },
    ],
    [
      'sin evidencia de película',
      () => {
        config.correspondencias[0].evidencia = '';
      },
    ],
    [
      'sin lugares',
      () => {
        config.lugares = [];
      },
    ],
    [
      'con lugares solo de Butaca',
      () => {
        config.lugares[0].fuentes[0].fuenteId = 'butaca';
      },
    ],
    [
      'con lugares de otra ciudad',
      () => {
        config.lugares[0].ciudadId = 'ar:550e8400-e29b-41d4-a716-446655440001';
      },
    ],
    [
      'sin dirección de SerpApi',
      () => {
        delete config.lugares[0].fuentes[0].direccion;
      },
    ],
    [
      'sin nombre de SerpApi',
      () => {
        delete config.lugares[0].fuentes[0].nombre;
      },
    ],
    [
      'sin evidencia municipal',
      () => {
        config.lugares[0].evidencia = '';
      },
    ],
    [
      'con correspondencias ambiguas',
      () => {
        config.correspondencias.push({ ...config.correspondencias[0], tmdbId: 79 });
      },
    ],
    [
      'con establecimientos ambiguos',
      () => {
        config.lugares.push({ ...config.lugares[0], clave: 'otro' });
      },
    ],
  ])('no gasta cuota %s', async (_caso, modificar) => {
    modificar();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { obtenerFuncionesSerpApi, verificarCorrespondenciasSerpApi } =
      await import('./serpApi.integration.js');
    expect(verificarCorrespondenciasSerpApi(parametros)).toBe(false);
    await expect(obtenerFuncionesSerpApi(parametros)).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('acepta horarios cuando hay correspondencias verificadas de película y establecimiento', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        search_metadata: { status: 'Success' },
        knowledge_graph: { title: 'Película de prueba', kgmid: '/m/pelicula-77' },
        showtimes: [
          {
            date: '2026-11-15',
            theaters: [
              {
                name: 'Cine Central',
                address: 'Calle 123',
                showing: [{ time: ['21:00'], type: '2D' }],
              },
            ],
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { obtenerFuncionesSerpApi, verificarCorrespondenciasSerpApi } =
      await import('./serpApi.integration.js');
    expect(verificarCorrespondenciasSerpApi(parametros)).toBe(true);
    const resultado = await obtenerFuncionesSerpApi(parametros);
    expect(resultado.estadoFuente).toBe('disponible');
    expect(resultado.funciones).toHaveLength(1);
    expect(resultado.funciones[0]).toMatchObject({
      tmdbId: 77,
      inicio: '2026-11-15T21:00:00-03:00',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
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
