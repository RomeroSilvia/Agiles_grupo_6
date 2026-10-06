import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';

vi.mock('../integrations/tmdb.integration.js', () => ({
  buscarPeliculas: vi.fn(),
  buscarSeries: vi.fn(),
  obtenerPelicula: vi.fn(),
  obtenerSerie: vi.fn(),
  obtenerDisponibilidad: vi.fn(),
}));

const detallePelicula = {
  tmdbId: 1,
  tipo: 'pelicula',
  nombre: 'Dune',
  sinopsis: 'En un futuro lejano...',
  posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
  anio: 2021,
  puntuacion: 8.1,
};

const detalleSerie = {
  tmdbId: 2,
  tipo: 'serie',
  nombre: 'The Office',
  sinopsis: 'Una comedia de oficina.',
  posterUrl: null,
  anio: 2005,
  puntuacion: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  tmdbIntegration.obtenerPelicula.mockResolvedValue(detallePelicula);
  tmdbIntegration.obtenerSerie.mockResolvedValue(detalleSerie);
  tmdbIntegration.obtenerDisponibilidad.mockResolvedValue({
    region: 'BR',
    ofertas: [
      {
        tipoOferta: 'suscripcion',
        plataformas: [
          { tmdbProviderId: 8, nombre: 'Netflix', logoUrl: 'https://image.tmdb.org/t/p/w92/n.jpg' },
        ],
      },
    ],
    enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch?locale=BR',
  });
});

describe('GET /api/titulos/:tipo/:tmdbId/disponibilidad', () => {
  it('consulta la disponibilidad con la región recibida del contexto', async () => {
    const res = await request(createApp())
      .get('/api/titulos/pelicula/1/disponibilidad')
      .query({ region: 'BR' });

    expect(res.status).toBe(200);
    expect(res.body.data.region).toBe('BR');
    expect(res.body.data.ofertas[0].plataformas[0].nombre).toBe('Netflix');
    expect(tmdbIntegration.obtenerDisponibilidad).toHaveBeenCalledWith({
      tipo: 'pelicula',
      tmdbId: 1,
      region: 'BR',
    });
  });

  it('rechaza una región inválida antes de consultar TMDB', async () => {
    const res = await request(createApp())
      .get('/api/titulos/serie/2/disponibilidad')
      .query({ region: 'Argentina' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(tmdbIntegration.obtenerDisponibilidad).not.toHaveBeenCalled();
  });

  it('devuelve un error cuando falla la consulta de disponibilidad', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    tmdbIntegration.obtenerDisponibilidad.mockRejectedValueOnce(new ExternalServiceError('TMDB'));

    const res = await request(createApp())
      .get('/api/titulos/serie/2/disponibilidad')
      .query({ region: 'BR' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE');
    consoleError.mockRestore();
  });
});

describe('GET /api/titulos/:tipo/:tmdbId', () => {
  it('devuelve el detalle de una película', async () => {
    const response = await request(createApp()).get('/api/titulos/pelicula/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: detallePelicula });
    expect(tmdbIntegration.obtenerPelicula).toHaveBeenCalledWith(1);
    expect(tmdbIntegration.obtenerSerie).not.toHaveBeenCalled();
  });

  it('devuelve el detalle de una serie', async () => {
    const response = await request(createApp()).get('/api/titulos/serie/2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: detalleSerie });
    expect(tmdbIntegration.obtenerSerie).toHaveBeenCalledWith(2);
    expect(tmdbIntegration.obtenerPelicula).not.toHaveBeenCalled();
  });

  it('responde 400 cuando los parámetros no son válidos', async () => {
    const response = await request(createApp()).get('/api/titulos/documental/no-es-un-id');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'tipo' }),
        expect.objectContaining({ field: 'tmdbId' }),
      ]),
    );
    expect(tmdbIntegration.obtenerPelicula).not.toHaveBeenCalled();
    expect(tmdbIntegration.obtenerSerie).not.toHaveBeenCalled();
  });

  it('responde 400 cuando el identificador no es un entero positivo', async () => {
    const response = await request(createApp()).get('/api/titulos/pelicula/1.5');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION');
    expect(tmdbIntegration.obtenerPelicula).not.toHaveBeenCalled();
  });

  it('responde 502 cuando TMDB falla', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    tmdbIntegration.obtenerPelicula.mockRejectedValueOnce(
      new ExternalServiceError('TMDB', new Error('sin conexión')),
    );

    const response = await request(createApp()).get('/api/titulos/pelicula/1');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: {
        code: 'EXTERNAL_SERVICE',
        message: 'No se pudo consultar TMDB',
      },
    });

    consoleError.mockRestore();
  });

  it('responde 404 cuando TMDB no encuentra el título', async () => {
    tmdbIntegration.obtenerPelicula.mockRejectedValueOnce(
      new NotFoundError('No se encontró el título solicitado'),
    );

    const response = await request(createApp()).get('/api/titulos/pelicula/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'No se encontró el título solicitado',
      },
    });
  });

  it('responde 502 cuando TMDB devuelve una estructura inválida', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    tmdbIntegration.obtenerPelicula.mockResolvedValueOnce({ id: 1 });

    const response = await request(createApp()).get('/api/titulos/pelicula/1');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: {
        code: 'EXTERNAL_SERVICE',
        message: 'No se pudo consultar TMDB',
      },
    });

    consoleError.mockRestore();
  });
});
