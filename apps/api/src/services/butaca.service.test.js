import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CIUDAD_CINE_FIXTURE } from '@buscador/shared/testing';
const config = vi.hoisted(() => ({ habilitado: false, verificado: false }));
vi.mock('../config/env.config.js', () => ({
  env: {
    get BUTACA_ENABLED() {
      return config.habilitado ? 'true' : 'false';
    },
  },
}));
vi.mock('../config/funcionesCine.config.js', async (importOriginal) => {
  const original = await importOriginal();
  const { CIUDAD_CINE_FIXTURE } = await import('@buscador/shared/testing');
  return {
    ...original,
    get BUTACA_VERIFICADO() {
      return config.verificado;
    },
    LUGARES_CINE: ['centro', 'norte', 'sur'].map((clave, indice) => ({
      clave,
      ciudadId: CIUDAD_CINE_FIXTURE.id,
      nombre: 'Cine de prueba',
      direccion: 'Calle 123',
      evidencia: 'Municipio revisado en fixture',
      fuentes: [{ fuenteId: 'butaca', registroId: String(indice + 1) }],
    })),
    CORRESPONDENCIAS_PELICULAS_CINE: [
      {
        fuenteId: 'butaca',
        registroId: 'corp-77',
        nombre: 'Película de prueba',
        tmdbId: 77,
        evidencia: 'Identidad revisada en fixture',
      },
    ],
  };
});
beforeEach(() => {
  vi.resetModules();
  config.habilitado = false;
  config.verificado = false;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-14T12:00:00Z');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const parametros = {
  pelicula: { tmdbId: 77 },
  ciudad: { ...CIUDAD_CINE_FIXTURE, butacaCines: [{ id: 1, slug: 'centro' }] },
  desde: '2026-11-14',
  hasta: '2026-11-21',
};
async function obtenerFuncionesButaca(params) {
  const { obtenerObservacionesButaca } = await import('./butaca.service.js');
  const { normalizarObservacionesCine } = await import('./funcionCine.normalizer.js');
  const { LUGARES_CINE } = await import('../config/funcionesCine.config.js');
  return normalizarObservacionesCine({
    ...(await obtenerObservacionesButaca(params)),
    lugares: LUGARES_CINE,
  });
}

describe('complemento Butaca / Cinemark', () => {
  function simularCartelera({
    direccion = 'Calle 123',
    duracion = 115,
    sucursales = parametros.ciudad.butacaCines,
    fallo = null,
  } = {}) {
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      if (fallo?.(url)) return { ok: false, status: 503 };
      return {
        ok: true,
        json: async () => ({
          data: url.pathname.endsWith('/theaters')
            ? sucursales.map(({ id, slug }) => ({
                id,
                slug,
                name: 'Cine de prueba',
                address: direccion,
                city: 'Interior',
                location: { name: 'Región del proveedor' },
              }))
            : url.pathname.endsWith('/movies')
              ? [
                  {
                    id: 'uuid-proveedor',
                    corporateId: 'corp-nuevo',
                    title: 'Nueva película',
                    openingDate: '2026-11-12T00:00:00.000Z',
                    runTime: duracion,
                  },
                ]
              : [
                  {
                    sessionId: `sesion-${url.searchParams.get('theater')}`,
                    corporateId: 'corp-nuevo',
                    movieName: 'Nueva película',
                    theaterId: url.searchParams.get('theater'),
                    theaterRoom: '2',
                    sessionDateTime: '2026-11-15T21:00:00.000Z',
                    sessionDisplayDate: '2026-11-15',
                    sessionFormat: '2D',
                  },
                ],
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }
  const sucursales = ['centro', 'norte', 'sur'].map((slug, indice) => ({ id: indice + 1, slug }));
  const consultaSucursales = {
    ...parametros,
    pelicula: {
      tmdbId: 77,
      identidadCine: { nombres: ['Nueva película'], anio: 2026, duracion: 115 },
    },
    ciudad: { ...parametros.ciudad, butacaCines: sucursales },
  };
  it.each([
    ['movies', '1'],
    ['movies', '2'],
    ['showtimes', '1'],
    ['showtimes', '2'],
  ])('conserva las otras sucursales si falla /%s en la sucursal %s', async (endpoint, id) => {
    config.habilitado = true;
    config.verificado = true;
    simularCartelera({
      sucursales,
      fallo: (url) =>
        url.pathname.endsWith(`/${endpoint}`) && url.searchParams.get('theater') === id,
    });
    const resultado = await obtenerFuncionesButaca(consultaSucursales);
    expect(resultado.funciones).toHaveLength(2);
    expect(resultado.funciones.map((funcion) => funcion.fuentes[0].registroId).sort()).toEqual(
      sucursales.filter((cine) => String(cine.id) !== id).map((cine) => `sesion-${cine.id}`),
    );
    expect(resultado.estadoFuente).toBe('incompleta');
    expect(resultado.advertencias).toContainEqual(
      expect.objectContaining({ code: 'INCOMPLETE_DATA', fuenteId: 'butaca' }),
    );
  });
  it.each(['movies', 'showtimes'])(
    'rechaza la consulta si /%s falla en todas las sucursales',
    async (endpoint) => {
      config.habilitado = true;
      config.verificado = true;
      const fetchMock = simularCartelera({
        sucursales,
        fallo: (url) => url.pathname.endsWith(`/${endpoint}`),
      });
      await expect(obtenerFuncionesButaca(consultaSucursales)).rejects.toMatchObject({
        code: 'EXTERNAL_SERVICE',
      });
      expect(
        fetchMock.mock.calls.filter(([url]) => url.pathname.endsWith(`/${endpoint}`)),
      ).toHaveLength(3);
    },
  );
  it('devuelve datos incompletos si una sucursal responde sin películas y las otras fallan', async () => {
    config.habilitado = true;
    config.verificado = true;
    const fetchMock = simularCartelera({
      sucursales,
      fallo: (url) => url.pathname.endsWith('/movies') && url.searchParams.get('theater') !== '1',
    });
    const consultar = fetchMock.getMockImplementation();
    fetchMock.mockImplementation((url) =>
      url.pathname.endsWith('/movies') && url.searchParams.get('theater') === '1'
        ? Promise.resolve({ ok: true, json: async () => ({ data: [] }) })
        : consultar(url),
    );
    const resultado = await obtenerFuncionesButaca(consultaSucursales);
    expect(resultado.funciones).toEqual([]);
    expect(resultado.estadoFuente).toBe('incompleta');
  });
  it('consulta horarios de una película nueva sin mapeo manual y reutiliza la caché', async () => {
    config.habilitado = true;
    config.verificado = true;
    const fetchMock = simularCartelera();
    const consulta = {
      ...parametros,
      pelicula: {
        tmdbId: 77,
        identidadCine: { nombres: ['Nueva película'], anio: 2026, duracion: 115 },
      },
    };
    const resultado = await obtenerFuncionesButaca(consulta);
    expect(resultado.funciones).toHaveLength(1);
    expect(resultado.funciones[0]).toMatchObject({
      tmdbId: 77,
      inicio: '2026-11-15T21:00:00-03:00',
    });
    expect(resultado.estadoFuente).toBe('disponible');
    await obtenerFuncionesButaca(consulta);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it.each([false, true])(
    'devuelve cero funciones sin advertencias si la película está ausente (cartelera vacía: %s)',
    async (vacia) => {
      config.habilitado = true;
      config.verificado = true;
      const fetchMock = simularCartelera();
      if (vacia) {
        const consultar = fetchMock.getMockImplementation();
        fetchMock.mockImplementation((url) =>
          url.pathname.endsWith('/movies')
            ? Promise.resolve({ ok: true, json: async () => ({ data: [] }) })
            : consultar(url),
        );
      }
      const resultado = await obtenerFuncionesButaca({
        ...parametros,
        pelicula: {
          tmdbId: 77,
          identidadCine: { nombres: ['Película de prueba'], anio: 2026, duracion: 115 },
        },
      });
      expect(resultado.funciones).toEqual([]);
      expect(resultado.estadoFuente).toBe('disponible');
      expect(resultado.advertencias).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );
  it('conserva datos incompletos si un ID conocido cambia de título', async () => {
    config.habilitado = true;
    config.verificado = true;
    const fetchMock = simularCartelera();
    const consultar = fetchMock.getMockImplementation();
    fetchMock.mockImplementation((url) =>
      url.pathname.endsWith('/movies')
        ? Promise.resolve({
            ok: true,
            json: async () => ({
              data: [{ id: 'uuid-proveedor', corporateId: 'corp-77', title: 'Otro título' }],
            }),
          })
        : consultar(url),
    );
    const resultado = await obtenerFuncionesButaca(parametros);
    expect(resultado.funciones).toEqual([]);
    expect(resultado.estadoFuente).toBe('incompleta');
    expect(resultado.advertencias).toContainEqual(
      expect.objectContaining({ code: 'INCOMPLETE_DATA', fuenteId: 'butaca' }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('publica una sola función por sesión aunque Cinemark repita sus formatos', async () => {
    config.habilitado = true;
    config.verificado = true;
    const fetchMock = simularCartelera({ sucursales });
    const consultar = fetchMock.getMockImplementation();
    fetchMock.mockImplementation(async (url) => {
      const respuesta = await consultar(url);
      if (!url.pathname.endsWith('/showtimes')) return respuesta;
      const { data } = await respuesta.json();
      return {
        ...respuesta,
        json: async () => ({
          data: [...data, ...data.map((horario) => ({ ...horario, sessionFormat: 'DBOX 2D' }))],
        }),
      };
    });
    const resultado = await obtenerFuncionesButaca(consultaSucursales);
    expect(resultado.funciones).toHaveLength(sucursales.length);
    expect(resultado.estadoFuente).toBe('disponible');
    expect(resultado.funciones.every((funcion) => funcion.formato === '2D / DBOX 2D')).toBe(true);
    expect(new Set(resultado.funciones.map((funcion) => funcion.id)).size).toBe(sucursales.length);
  });
  it('excluye una sucursal que conserva ID pero cambia su dirección revisada', async () => {
    config.habilitado = true;
    config.verificado = true;
    const fetchMock = simularCartelera({ direccion: 'Otra sucursal 999' });
    const resultado = await obtenerFuncionesButaca(parametros);
    expect(resultado.funciones).toEqual([]);
    expect(resultado.estadoFuente).toBe('incompleta');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('no atribuye horarios por título cuando la duración contradice la identidad TMDB', async () => {
    config.habilitado = true;
    config.verificado = true;
    const fetchMock = simularCartelera({ duracion: 90 });
    const resultado = await obtenerFuncionesButaca({
      ...parametros,
      pelicula: {
        tmdbId: 77,
        identidadCine: { nombres: ['Nueva película'], anio: 2026, duracion: 115 },
      },
    });
    expect(resultado.funciones).toEqual([]);
    expect(resultado.estadoFuente).toBe('incompleta');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('no consulta una fuente deshabilitada ni habilitada sin verificación', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(obtenerFuncionesButaca(parametros)).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
    });
    config.habilitado = true;
    await expect(obtenerFuncionesButaca(parametros)).rejects.toMatchObject({
      code: 'EXTERNAL_SERVICE',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('lee solo cines, películas y horarios con corporateId, sin restar tres horas ni crear una compra', async () => {
    config.habilitado = true;
    config.verificado = true;
    const fetchMock = vi.fn().mockImplementation(async (url) => ({
      ok: true,
      json: async () => ({
        data: url.pathname.endsWith('/theaters')
          ? [
              {
                id: 1,
                slug: 'centro',
                name: 'Cine de prueba',
                address: 'Calle 123',
                city: CIUDAD_CINE_FIXTURE.nombre,
                location: { name: CIUDAD_CINE_FIXTURE.provincia },
              },
            ]
          : url.pathname.endsWith('/movies')
            ? [{ id: 'no-es-tmdb', corporateId: 'corp-77', title: 'Película de prueba' }]
            : [
                {
                  sessionId: 's1',
                  corporateId: 'corp-77',
                  movieName: 'Película de prueba',
                  theaterId: '1',
                  theaterRoom: '3',
                  sessionDateTime: '2026-11-15T00:30:00Z',
                  sessionDisplayDate: '2026-11-15',
                  sessionFormat: '2D',
                  language: { shortName: 'SUB', name: 'Subtitulada' },
                },
              ],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    const respuesta = await obtenerFuncionesButaca(parametros);
    expect(respuesta.funciones[0]).toMatchObject({
      horaLocal: '00:30',
      inicio: '2026-11-15T00:30:00-03:00',
      urlCompra: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][0].searchParams.get('movieCorporateId')).toBe('corp-77');
    for (const [url, options] of fetchMock.mock.calls) {
      expect(url.pathname).toMatch(/^\/api\/cinema\/(theaters|movies|showtimes)$/);
      expect(options.method).toBeUndefined();
      expect(options.headers.country).toBe('AR');
      expect(url.searchParams.has('api_key')).toBe(false);
    }
  });
  it('traduce bloqueo o sala de espera a indisponibilidad sin cambiar el transporte', async () => {
    config.habilitado = true;
    config.verificado = true;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const { listarCinesButaca } = await import('../integrations/butaca.integration.js');
    await expect(listarCinesButaca()).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
  });
});
