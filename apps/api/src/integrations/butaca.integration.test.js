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
    LUGARES_CINE: [
      {
        clave: 'centro',
        ciudadId: CIUDAD_CINE_FIXTURE.id,
        nombre: 'Cine de prueba',
        direccion: 'Calle 123',
        evidencia: 'Municipio revisado en fixture',
        fuentes: [{ fuenteId: 'butaca', registroId: '1' }],
      },
    ],
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
describe('complemento Butaca / Cinemark', () => {
  it('no consulta una fuente deshabilitada ni habilitada sin verificación', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { obtenerFuncionesButaca } = await import('./butaca.integration.js');
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
    const { obtenerFuncionesButaca } = await import('./butaca.integration.js');
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
    const { listarCinesButaca } = await import('./butaca.integration.js');
    await expect(listarCinesButaca()).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
  });
});
