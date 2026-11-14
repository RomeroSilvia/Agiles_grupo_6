import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { CARTELERA_CONFIG } from '../config/tmdb.config.js';
import { ExternalServiceError } from '../errors/index.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';

vi.mock('../integrations/tmdb.integration.js', () => ({
  listarPeliculasEnCartelera: vi.fn(),
  obtenerFechaEstrenoArgentina: vi.fn(),
}));

const consultadoEn = '2026-11-13T23:00:00.000Z';
let ahora = Date.parse(consultadoEn);
const pelicula = {
  tmdbId: 77,
  tipo: 'pelicula',
  nombre: 'Película de prueba',
  posterUrl: null,
  anio: 2026,
  puntuacion: 7.5,
};

beforeEach(() => {
  vi.clearAllMocks();
  ahora += CARTELERA_CONFIG.RATE_LIMIT.windowMs;
  vi.spyOn(Date, 'now').mockReturnValue(ahora);
  tmdbIntegration.listarPeliculasEnCartelera.mockResolvedValue({
    resultados: [pelicula],
    pagina: 1,
    totalResultados: 1,
    totalPaginas: 1,
    consultadoEn,
  });
  tmdbIntegration.obtenerFechaEstrenoArgentina.mockResolvedValue({
    fechaEstrenoAr: '2026-06-08',
    consultadoEn,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/cartelera', () => {
  it('responde públicamente con películas, fecha argentina y procedencia', async () => {
    const response = await request(createApp()).get('/api/cartelera');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      region: 'AR',
      resultados: [
        {
          ...pelicula,
          region: 'AR',
          estadoExhibicion: 'cartelera_proveedor',
          fechaEstrenoAr: '2026-06-08',
          estadoFecha: 'informada',
          fuente: {
            fuenteId: 'tmdb',
            registroId: '77',
            url: null,
            consultadoEn,
            actualizadoEn: null,
          },
        },
      ],
      pagina: 1,
      totalResultados: 1,
      totalPaginas: 1,
      fuente: {
        fuenteId: 'tmdb',
        registroId: null,
        url: null,
        consultadoEn,
        actualizadoEn: null,
      },
    });
    expect(tmdbIntegration.listarPeliculasEnCartelera).toHaveBeenCalledWith({ pagina: 1 });
    expect(tmdbIntegration.obtenerFechaEstrenoArgentina).toHaveBeenCalledWith({ tmdbId: 77 });
  });

  it('devuelve una página vacía sin reiniciarla', async () => {
    tmdbIntegration.listarPeliculasEnCartelera.mockResolvedValueOnce({
      resultados: [],
      pagina: 3,
      totalResultados: 0,
      totalPaginas: 2,
      consultadoEn,
    });

    const response = await request(createApp()).get('/api/cartelera?pagina=3');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      resultados: [],
      pagina: 3,
      totalResultados: 0,
      totalPaginas: 2,
    });
    expect(tmdbIntegration.obtenerFechaEstrenoArgentina).not.toHaveBeenCalled();
  });

  it('marca como pendiente una fecha argentina aún no informada por TMDB', async () => {
    tmdbIntegration.obtenerFechaEstrenoArgentina.mockResolvedValueOnce({
      fechaEstrenoAr: null,
      consultadoEn,
    });

    const response = await request(createApp()).get('/api/cartelera');

    expect(response.status).toBe(200);
    expect(response.body.data.resultados[0]).toMatchObject({
      fechaEstrenoAr: null,
      estadoFecha: 'pendiente',
    });
  });

  it('rechaza parámetros inválidos antes de consultar TMDB', async () => {
    for (const query of ['?pagina=', '?pagina=1.5', '?pagina=501', '?pagina=1&region=CL']) {
      const response = await request(createApp()).get(`/api/cartelera${query}`);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION');
    }

    expect(tmdbIntegration.listarPeliculasEnCartelera).not.toHaveBeenCalled();
  });

  it('propaga errores de TMDB o fechas como error externo, no como lista vacía', async () => {
    tmdbIntegration.obtenerFechaEstrenoArgentina.mockRejectedValueOnce(
      new ExternalServiceError('TMDB', new Error('falló TMDB')),
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(createApp()).get('/api/cartelera');

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('EXTERNAL_SERVICE');
    expect(response.body.data).toBeUndefined();
    consoleError.mockRestore();
  });

  it('responde 500 si la salida del servicio incumple el contrato, sin atribuirlo a TMDB', async () => {
    tmdbIntegration.obtenerFechaEstrenoArgentina.mockResolvedValueOnce({
      fechaEstrenoAr: 'fecha inválida',
      consultadoEn,
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(createApp()).get('/api/cartelera');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL');
    expect(response.body.data).toBeUndefined();
  });

  it('responde 429 al superar el límite local y permite consultar al vencer la ventana', async () => {
    const { maxRequests, windowMs } = CARTELERA_CONFIG.RATE_LIMIT;
    const inicioVentana = Date.now();
    const app = createApp();

    for (let intento = 0; intento < maxRequests; intento += 1) {
      const response = await request(app).get('/api/cartelera');
      expect(response.status).toBe(200);
    }
    expect(tmdbIntegration.listarPeliculasEnCartelera).toHaveBeenCalledTimes(maxRequests);

    const response = await request(app).get('/api/cartelera');

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
    expect(Number(response.headers['retry-after'])).toBe(Math.ceil(windowMs / 1000));
    expect(response.headers['ratelimit-remaining']).toBe('0');
    expect(tmdbIntegration.listarPeliculasEnCartelera).toHaveBeenCalledTimes(maxRequests);
    expect(tmdbIntegration.obtenerFechaEstrenoArgentina).toHaveBeenCalledTimes(maxRequests);

    vi.mocked(Date.now).mockReturnValue(inicioVentana + windowMs);
    const recuperada = await request(app).get('/api/cartelera');
    expect(recuperada.status).toBe(200);
    expect(tmdbIntegration.listarPeliculasEnCartelera).toHaveBeenCalledTimes(maxRequests + 1);
  });
});
