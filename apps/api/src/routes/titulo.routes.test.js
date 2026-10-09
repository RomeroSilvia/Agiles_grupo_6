import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';

vi.mock('../integrations/tmdb.integration.js', () => ({
  buscarPeliculas: vi.fn(),
  buscarSeries: vi.fn(),
  obtenerPelicula: vi.fn(),
  obtenerSerie: vi.fn(),
  obtenerOfertas: vi.fn(),
}));

vi.mock('../repositories/plataforma.repository.js', () => ({
  listarActivas: vi.fn(),
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

const plataformasActivas = [
  {
    id: 1,
    tmdbProviderId: 8,
    nombre: 'Netflix',
    logoPath: null,
    urlHome: 'https://www.netflix.com',
  },
  {
    id: 2,
    tmdbProviderId: 119,
    nombre: 'Amazon Prime Video',
    logoPath: '/prime.jpg',
    urlHome: 'https://www.primevideo.com',
  },
  {
    id: 3,
    tmdbProviderId: 337,
    nombre: 'Disney Plus',
    logoPath: '/disney.jpg',
    urlHome: 'https://www.disneyplus.com',
  },
];

const ofertasTmdb = {
  AR: [
    { tmdbProviderId: 8, tipoOferta: 'suscripcion', logoPath: '/netflix.jpg' },
    { tmdbProviderId: 119, tipoOferta: 'suscripcion', logoPath: '/prime.jpg' },
    { tmdbProviderId: 337, tipoOferta: 'alquiler', logoPath: '/disney.jpg' },
  ],
  US: [{ tmdbProviderId: 337, tipoOferta: 'suscripcion', logoPath: '/disney.jpg' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  tmdbIntegration.obtenerPelicula.mockResolvedValue(detallePelicula);
  tmdbIntegration.obtenerSerie.mockResolvedValue(detalleSerie);
  tmdbIntegration.obtenerOfertas.mockResolvedValue(ofertasTmdb);
  plataformaRepository.listarActivas.mockResolvedValue(plataformasActivas);
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

describe('GET /api/titulos/:tipo/:tmdbId/disponibilidad', () => {
  it('devuelve las plataformas disponibles para la región detectada por defecto (AR)', async () => {
    const response = await request(createApp()).get('/api/titulos/pelicula/1/disponibilidad');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        region: 'AR',
        plataformas: [
          {
            id: 1,
            tmdbProviderId: 8,
            nombre: 'Netflix',
            logoPath: '/netflix.jpg',
            urlHome: 'https://www.netflix.com',
          },
          {
            id: 2,
            tmdbProviderId: 119,
            nombre: 'Amazon Prime Video',
            logoPath: '/prime.jpg',
            urlHome: 'https://www.primevideo.com',
          },
        ],
      },
    });
    expect(tmdbIntegration.obtenerOfertas).toHaveBeenCalledWith({ tipo: 'pelicula', tmdbId: 1 });
  });

  it('permite consultar la disponibilidad para una región específica', async () => {
    const response = await request(createApp()).get(
      '/api/titulos/serie/2/disponibilidad?region=US',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        region: 'US',
        plataformas: [
          {
            id: 3,
            tmdbProviderId: 337,
            nombre: 'Disney Plus',
            logoPath: '/disney.jpg',
            urlHome: 'https://www.disneyplus.com',
          },
        ],
      },
    });
    expect(tmdbIntegration.obtenerOfertas).toHaveBeenCalledWith({ tipo: 'serie', tmdbId: 2 });
  });

  it('devuelve lista vacía si el título no está disponible en la región solicitada', async () => {
    const response = await request(createApp()).get(
      '/api/titulos/pelicula/1/disponibilidad?region=ES',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        region: 'ES',
        plataformas: [],
      },
    });
  });

  it('responde 400 si el parámetro tipo no es válido', async () => {
    const response = await request(createApp()).get('/api/titulos/novela/1/disponibilidad');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION');
  });

  it('responde 400 si el código de región no es válido', async () => {
    const response = await request(createApp()).get(
      '/api/titulos/pelicula/1/disponibilidad?region=argentina',
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION');
  });

  it('devuelve lista vacía cuando TMDB no tiene ofertas del título', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValueOnce({});

    const response = await request(createApp()).get('/api/titulos/pelicula/999/disponibilidad');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { region: 'AR', plataformas: [] } });
  });

  it('responde 502 cuando la integración con TMDB falla', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    tmdbIntegration.obtenerOfertas.mockRejectedValueOnce(
      new ExternalServiceError('TMDB', new Error('timeout')),
    );

    const response = await request(createApp()).get('/api/titulos/pelicula/1/disponibilidad');

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('EXTERNAL_SERVICE');

    consoleError.mockRestore();
  });
});
