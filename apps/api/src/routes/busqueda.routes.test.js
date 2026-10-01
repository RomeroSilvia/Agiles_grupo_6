import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { ExternalServiceError } from '../errors/index.js';

vi.mock('../integrations/tmdb.integration.js', () => ({
  buscarPeliculas: vi.fn(),
  buscarSeries: vi.fn(),
}));

const pelicula = {
  id: 1,
  title: 'Dune',
  release_date: '2021-10-22',
  poster_path: '/dune.jpg',
  vote_average: 8.1,
  popularity: 100,
};

const serie = {
  id: 2,
  name: 'Dune: Prophecy',
  first_air_date: '2024-11-17',
  poster_path: '/prophecy.jpg',
  vote_average: 7.4,
  popularity: 80,
};

beforeEach(() => {
  vi.clearAllMocks();
  tmdbIntegration.buscarPeliculas.mockResolvedValue({
    page: 1,
    results: [pelicula],
    total_results: 1,
    total_pages: 1,
  });
  tmdbIntegration.buscarSeries.mockResolvedValue({
    page: 1,
    results: [serie],
    total_results: 1,
    total_pages: 1,
  });
});

describe('GET /api/busqueda', () => {
  it('filtra por tipo y año', async () => {
    const response = await request(createApp()).get('/api/busqueda').query({
      q: 'dune',
      tipo: 'pelicula',
      anio: '2021',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        resultados: [
          {
            tmdbId: 1,
            tipo: 'pelicula',
            nombre: 'Dune',
            anio: 2021,
            posterPath: '/dune.jpg',
            puntuacion: 8.1,
          },
        ],
        pagina: 1,
        totalResultados: 1,
        totalPaginas: 1,
      },
    });
    expect(tmdbIntegration.buscarPeliculas).toHaveBeenCalledWith({
      q: 'dune',
      anio: 2021,
      pagina: 1,
    });
    expect(tmdbIntegration.buscarSeries).not.toHaveBeenCalled();
  });

  it('combina películas y series cuando no se selecciona tipo', async () => {
    const response = await request(createApp()).get('/api/busqueda').query({ q: 'dune' });

    expect(response.status).toBe(200);
    expect(response.body.data.resultados).toHaveLength(2);
    expect(response.body.data.totalResultados).toBe(2);
    expect(tmdbIntegration.buscarPeliculas).toHaveBeenCalledWith({
      q: 'dune',
      anio: undefined,
      pagina: 1,
    });
    expect(tmdbIntegration.buscarSeries).toHaveBeenCalledWith({
      q: 'dune',
      anio: undefined,
      pagina: 1,
    });
  });

  it('responde una lista vacía cuando no hay resultados', async () => {
    tmdbIntegration.buscarPeliculas.mockResolvedValueOnce({
      results: [],
      total_results: 0,
      total_pages: 0,
    });
    tmdbIntegration.buscarSeries.mockResolvedValueOnce({
      results: [],
      total_results: 0,
      total_pages: 0,
    });

    const response = await request(createApp()).get('/api/busqueda').query({ q: 'inexistente' });

    expect(response.status).toBe(200);
    expect(response.body.data.resultados).toEqual([]);
    expect(response.body.data.totalResultados).toBe(0);
  });

  it('responde 400 cuando los filtros no son válidos', async () => {
    const response = await request(createApp()).get('/api/busqueda').query({
      q: 'dune',
      tipo: 'documental',
      anio: '1800',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'tipo' }),
        expect.objectContaining({ field: 'anio' }),
      ]),
    );
    expect(tmdbIntegration.buscarPeliculas).not.toHaveBeenCalled();
  });

  it('responde 400 cuando falta el título', async () => {
    const response = await request(createApp()).get('/api/busqueda').query({ tipo: 'serie' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION');
  });

  it('responde 502 cuando TMDB no está disponible', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    tmdbIntegration.buscarPeliculas.mockRejectedValueOnce(
      new ExternalServiceError('TMDB', new Error('sin conexión')),
    );

    const response = await request(createApp()).get('/api/busqueda').query({
      q: 'dune',
      tipo: 'pelicula',
    });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: {
        code: 'EXTERNAL_SERVICE',
        message: 'No se pudo consultar TMDB',
      },
    });

    consoleError.mockRestore();
  });

  it('responde 502 cuando TMDB devuelve datos inválidos', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    tmdbIntegration.buscarPeliculas.mockResolvedValueOnce({
      page: 1,
      results: [{ ...pelicula, id: 'incorrecto' }],
      total_results: 1,
      total_pages: 1,
    });

    const response = await request(createApp()).get('/api/busqueda').query({
      q: 'dune',
      tipo: 'pelicula',
    });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('EXTERNAL_SERVICE');

    consoleError.mockRestore();
  });
});
