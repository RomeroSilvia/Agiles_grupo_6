import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { CIUDAD_CINE_FIXTURE, crearRespuestaFuncionesFixture } from '@buscador/shared/testing';
import { createApp } from '../app.js';
import * as funcionCineService from '../services/funcionCine.service.js';
import { FUNCIONES_CINE_CONFIG } from '../config/funcionesCine.config.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';
vi.mock('../services/funcionCine.service.js', () => ({ obtenerFuncionesPelicula: vi.fn() }));
const ruta = '/api/cartelera/peliculas/77/funciones';
let minuto = 0;
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.parse('2026-11-14T12:00:00Z') + ++minuto * 60_000);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  funcionCineService.obtenerFuncionesPelicula.mockResolvedValue(crearRespuestaFuncionesFixture());
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe('consulta pública de funciones', () => {
  it('devuelve funciones sin sesión y utiliza solo parámetros validados', async () => {
    const respuesta = await request(createApp())
      .get(ruta)
      .query({ ciudadId: CIUDAD_CINE_FIXTURE.id });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.funciones).toHaveLength(3);
    expect(funcionCineService.obtenerFuncionesPelicula).toHaveBeenCalledWith({
      tmdbId: 77,
      ciudadId: CIUDAD_CINE_FIXTURE.id,
    });
  });
  it.each([
    {},
    { ciudadId: 'AR' },
    { ciudadId: CIUDAD_CINE_FIXTURE.id, fecha: '2026-11-15' },
    { 'ciudadId[]': CIUDAD_CINE_FIXTURE.id },
  ])('rechaza consultas inválidas: %j', async (query) => {
    expect((await request(createApp()).get(ruta).query(query)).status).toBe(400);
    expect(funcionCineService.obtenerFuncionesPelicula).not.toHaveBeenCalled();
  });
  it.each([
    [new NotFoundError('Película inexistente'), 404],
    [new ExternalServiceError('Cinemark'), 502],
    [new Error('Configuración inválida'), 500],
  ])('propaga el estado del error del servicio', async (error, status) => {
    funcionCineService.obtenerFuncionesPelicula.mockRejectedValue(error);
    expect(
      (await request(createApp()).get(ruta).query({ ciudadId: CIUDAD_CINE_FIXTURE.id })).status,
    ).toBe(status);
  });
  it('responde 429 sin consultar el servicio al superar el límite', async () => {
    const app = createApp();
    for (let i = 0; i < FUNCIONES_CINE_CONFIG.RATE_LIMIT.maxRequests; i += 1) {
      expect(
        (await request(app).get(ruta).query({ ciudadId: CIUDAD_CINE_FIXTURE.id })).status,
      ).toBe(200);
    }
    const respuesta = await request(app).get(ruta).query({ ciudadId: CIUDAD_CINE_FIXTURE.id });
    expect(respuesta.status).toBe(429);
    expect(respuesta.body.error.code).toBe('RATE_LIMITED');
    expect(funcionCineService.obtenerFuncionesPelicula).toHaveBeenCalledTimes(
      FUNCIONES_CINE_CONFIG.RATE_LIMIT.maxRequests,
    );
  });
});
