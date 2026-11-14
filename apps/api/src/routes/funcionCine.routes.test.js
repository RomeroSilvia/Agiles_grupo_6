import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { CIUDAD_CINE_FIXTURE, crearRespuestaFuncionesFixture } from '@buscador/shared/testing';
import { createApp } from '../app.js';
import * as tmdb from '../integrations/tmdb.integration.js';
import * as serpApi from '../integrations/serpApi.integration.js';
import * as butaca from '../integrations/butaca.integration.js';
import * as ciudades from '../services/ciudadCine.service.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';

vi.mock('../integrations/tmdb.integration.js', () => ({ obtenerDetalle: vi.fn() }));
vi.mock('../integrations/serpApi.integration.js', () => ({ obtenerFuncionesSerpApi: vi.fn() }));
vi.mock('../integrations/butaca.integration.js', () => ({
  obtenerFuncionesButaca: vi.fn(),
  estaHabilitadoButaca: vi.fn(),
}));
vi.mock('../services/ciudadCine.service.js', () => ({
  obtenerCiudadCine: vi.fn(),
  listarCiudadesCine: vi.fn(),
}));
let minuto = 0;
const ruta = `/api/cartelera/peliculas/77/funciones?ciudadId=${CIUDAD_CINE_FIXTURE.id}`;
const resultadoProveedor = () => {
  const { cines, funciones, fuentes } = crearRespuestaFuncionesFixture();
  return { cines, funciones, fuentes, advertencias: [], estadoFuente: 'disponible' };
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.parse('2026-11-14T12:00:00Z') + ++minuto * 60_000);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  ciudades.obtenerCiudadCine.mockReturnValue({
    ...CIUDAD_CINE_FIXTURE,
    serpApiLocation: 'Ciudad de prueba,Argentina',
    butacaCines: [],
  });
  tmdb.obtenerDetalle.mockResolvedValue({ tmdbId: 77, nombre: 'Película de prueba' });
  serpApi.obtenerFuncionesSerpApi.mockResolvedValue(resultadoProveedor());
  butaca.estaHabilitadoButaca.mockReturnValue(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe('consulta pública única de funciones', () => {
  it('descarta horarios vencidos de caché y declara el truncamiento sin ocultarlo', async () => {
    const resultado = resultadoProveedor();
    resultado.funciones = Array.from({ length: 1002 }, (_, indice) => ({
      ...resultado.funciones[0],
      id: `funcion:${indice.toString(16).padStart(64, '0')}`,
    }));
    resultado.funciones.push({
      ...resultado.funciones[0],
      id: `funcion:${'f'.repeat(64)}`,
      fechaLocal: '2026-11-14',
      horaLocal: '00:30',
      inicio: '2026-11-14T00:30:00-03:00',
    });
    serpApi.obtenerFuncionesSerpApi.mockResolvedValueOnce(resultado);
    const respuesta = await request(createApp()).get(ruta);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.funciones).toHaveLength(1000);
    expect(respuesta.body.data.estado).toBe('incompleta');
    expect(respuesta.body.data.advertencias).toContainEqual(
      expect.objectContaining({ code: 'INCOMPLETE_DATA', fuenteId: null }),
    );
    expect(
      respuesta.body.data.funciones.every((funcion) => funcion.fechaLocal === '2026-11-15'),
    ).toBe(true);
  });
  it('devuelve F1 con horarios y procedencia sin autenticación', async () => {
    const respuesta = await request(createApp()).get(ruta);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data).toMatchObject({
      tmdbId: 77,
      ciudad: CIUDAD_CINE_FIXTURE,
      estado: 'disponible',
      desde: '2026-11-14',
      hasta: '2026-11-21',
      consultadoEn: '2026-11-14T12:00:00.000Z',
    });
    expect(respuesta.body.data.funciones).toHaveLength(3);
  });
  it.each([
    '',
    '?ciudadId=AR',
    `?ciudadId=${CIUDAD_CINE_FIXTURE.id}&fecha=2026-11-15`,
    `?ciudadId[]=${CIUDAD_CINE_FIXTURE.id}`,
    `?ciudadId=${CIUDAD_CINE_FIXTURE.id}&cineId=algo`,
  ])('rechaza consulta inválida antes de red: %s', async (query) => {
    const respuesta = await request(createApp()).get(
      `/api/cartelera/peliculas/77/funciones${query}`,
    );
    expect(respuesta.status).toBe(400);
    expect(serpApi.obtenerFuncionesSerpApi).not.toHaveBeenCalled();
  });
  it('distingue ciudad desconocida y película inexistente como 404', async () => {
    ciudades.obtenerCiudadCine.mockImplementationOnce(() => {
      throw new NotFoundError('Ciudad no soportada');
    });
    expect((await request(createApp()).get(ruta)).status).toBe(404);
    expect(tmdb.obtenerDetalle).not.toHaveBeenCalled();
    tmdb.obtenerDetalle.mockRejectedValueOnce(new NotFoundError('Película inexistente'));
    expect((await request(createApp()).get(ruta)).status).toBe(404);
  });
  it('distingue sin cobertura, vacío estructurado e incompletitud sin resultados', async () => {
    ciudades.obtenerCiudadCine.mockReturnValueOnce({
      ...CIUDAD_CINE_FIXTURE,
      cobertura: 'sin_cobertura',
      butacaCines: [],
    });
    expect((await request(createApp()).get(ruta)).body.data.estado).toBe('sin_cobertura');
    expect(serpApi.obtenerFuncionesSerpApi).not.toHaveBeenCalled();
    serpApi.obtenerFuncionesSerpApi.mockResolvedValueOnce({
      ...resultadoProveedor(),
      cines: [],
      funciones: [],
    });
    expect((await request(createApp()).get(ruta)).body.data.estado).toBe('sin_funciones');
    serpApi.obtenerFuncionesSerpApi.mockResolvedValueOnce({
      ...resultadoProveedor(),
      cines: [],
      funciones: [],
      estadoFuente: 'incompleta',
    });
    expect((await request(createApp()).get(ruta)).body.data.estado).toBe('incompleta');
  });
  it('conserva el complemento autorizado ante cuota agotada y no consulta fuentes deshabilitadas', async () => {
    const cause = Object.assign(new Error('cuota'), { quota: true });
    serpApi.obtenerFuncionesSerpApi.mockRejectedValue(new ExternalServiceError('SerpApi', cause));
    expect((await request(createApp()).get(ruta)).status).toBe(502);
    expect(butaca.obtenerFuncionesButaca).not.toHaveBeenCalled();
    ciudades.obtenerCiudadCine.mockReturnValue({
      ...CIUDAD_CINE_FIXTURE,
      serpApiLocation: 'Ciudad,Argentina',
      butacaCines: [{ id: 1, slug: 'centro' }],
    });
    butaca.estaHabilitadoButaca.mockReturnValue(true);
    butaca.obtenerFuncionesButaca.mockResolvedValue(resultadoProveedor());
    const respuesta = await request(createApp()).get(ruta);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('incompleta');
    expect(respuesta.body.data.advertencias).toContainEqual(
      expect.objectContaining({ code: 'QUOTA_EXHAUSTED' }),
    );
  });
  it('responde 502 si todas las fuentes fallan y 429 al superar cinco consultas por minuto', async () => {
    serpApi.obtenerFuncionesSerpApi.mockRejectedValue(new ExternalServiceError('SerpApi'));
    const app = createApp();
    for (let indice = 0; indice < 5; indice += 1)
      expect((await request(app).get(ruta)).status).toBe(502);
    const limitada = await request(app).get(ruta);
    expect(limitada.status).toBe(429);
    expect(limitada.body.error.code).toBe('RATE_LIMITED');
  });
});
