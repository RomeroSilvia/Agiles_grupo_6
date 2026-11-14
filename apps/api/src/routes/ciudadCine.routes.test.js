import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { ExternalServiceError } from '../errors/index.js';
import * as ciudadCineService from '../services/ciudadCine.service.js';

vi.mock('../services/ciudadCine.service.js', () => ({
  listarCiudadesCine: vi.fn(),
}));

const respuesta = {
  pais: 'AR',
  ciudades: [
    {
      id: 'ar:550e8400-e29b-41d4-a716-446655440000',
      nombre: 'Córdoba',
      provincia: 'Córdoba',
      pais: 'AR',
      zonaHoraria: 'America/Argentina/Cordoba',
      cobertura: 'disponible',
      fuente: {
        fuenteId: 'serpapi',
        registroId: 'cordoba',
        url: null,
        consultadoEn: '2026-11-13T10:00:00.000Z',
        actualizadoEn: null,
      },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  ciudadCineService.listarCiudadesCine.mockReturnValue(respuesta);
});

describe('GET /api/cartelera/ciudades', () => {
  it('publica ciudades validadas sin requerir sesión', async () => {
    const response = await request(createApp()).get('/api/cartelera/ciudades');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(respuesta);
  });

  it('rechaza parámetros de consulta desconocidos', async () => {
    const response = await request(createApp())
      .get('/api/cartelera/ciudades')
      .query({ region: 'AR' });

    expect(response.status).toBe(400);
    expect(ciudadCineService.listarCiudadesCine).not.toHaveBeenCalled();
  });

  it('propaga los errores de configuración del directorio', async () => {
    ciudadCineService.listarCiudadesCine.mockImplementationOnce(() => {
      throw new ExternalServiceError('el directorio de ciudades', new Error('Sin cobertura'));
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(createApp()).get('/api/cartelera/ciudades');

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('EXTERNAL_SERVICE');
    consoleError.mockRestore();
  });
});
