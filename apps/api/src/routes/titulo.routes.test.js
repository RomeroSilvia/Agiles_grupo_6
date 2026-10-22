import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as streamingAvailabilityIntegration from '../integrations/streamingAvailability.integration.js';
import * as disponibilidadRepository from '../repositories/disponibilidad.repository.js';
import * as fuenteDatosRepository from '../repositories/fuenteDatos.repository.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import * as sincronizacionRepository from '../repositories/sincronizacion.repository.js';
import * as tituloRepository from '../repositories/titulo.repository.js';
import * as authRepository from '../repositories/auth.repository.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';
import { USUARIO } from '../test/fixtures.js';

vi.mock('../repositories/auth.repository.js');

vi.mock('../integrations/tmdb.integration.js', () => ({
  obtenerDetalle: vi.fn(),
  obtenerOfertas: vi.fn(),
}));

vi.mock('../repositories/plataforma.repository.js', () => ({
  listarActivas: vi.fn(),
}));

vi.mock('../integrations/streamingAvailability.integration.js', () => ({
  obtenerDeepLinks: vi.fn(),
}));

vi.mock('../repositories/titulo.repository.js', () => ({
  obtenerPorTmdbIdYTipo: vi.fn(),
  guardarDesdeTmdb: vi.fn(),
}));

vi.mock('../repositories/disponibilidad.repository.js', () => ({
  listarPorTituloYRegion: vi.fn(),
  guardarDeepLinks: vi.fn(),
}));

vi.mock('../repositories/fuenteDatos.repository.js', () => ({
  obtenerIdPorNombre: vi.fn(),
}));

vi.mock('../repositories/sincronizacion.repository.js', () => ({
  iniciar: vi.fn(),
  reservarConsultaDisponibilidad: vi.fn(),
  finalizar: vi.fn(),
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
  AR: {
    enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
    ofertas: [
      { tmdbProviderId: 8, tipoOferta: 'suscripcion', logoPath: '/netflix.jpg' },
      { tmdbProviderId: 119, tipoOferta: 'suscripcion', logoPath: '/prime.jpg' },
      { tmdbProviderId: 337, tipoOferta: 'alquiler', logoPath: '/disney.jpg' },
    ],
  },
  US: {
    enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
    ofertas: [{ tmdbProviderId: 337, tipoOferta: 'suscripcion', logoPath: '/disney.jpg' }],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  authRepository.obtenerUsuarioPorToken.mockResolvedValue(USUARIO);
  tmdbIntegration.obtenerDetalle.mockImplementation((tipo) =>
    Promise.resolve(tipo === 'pelicula' ? detallePelicula : detalleSerie),
  );
  tmdbIntegration.obtenerOfertas.mockResolvedValue(ofertasTmdb);
  plataformaRepository.listarActivas.mockResolvedValue(plataformasActivas);
  streamingAvailabilityIntegration.obtenerDeepLinks.mockResolvedValue([]);
  tituloRepository.obtenerPorTmdbIdYTipo.mockResolvedValue(null);
  tituloRepository.guardarDesdeTmdb.mockResolvedValue({ id: 10 });
  disponibilidadRepository.listarPorTituloYRegion.mockResolvedValue([]);
  disponibilidadRepository.guardarDeepLinks.mockResolvedValue();
  fuenteDatosRepository.obtenerIdPorNombre.mockResolvedValue(2);
  sincronizacionRepository.iniciar.mockResolvedValue({
    id: 1,
    iniciadaEn: '2026-10-20T03:00:00.000Z',
  });
  sincronizacionRepository.reservarConsultaDisponibilidad.mockResolvedValue(true);
  sincronizacionRepository.finalizar.mockResolvedValue(undefined);
});

describe('GET /api/titulos/:tipo/:tmdbId', () => {
  it('devuelve el detalle de una película', async () => {
    const response = await request(createApp()).get('/api/titulos/pelicula/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: detallePelicula });
    expect(tmdbIntegration.obtenerDetalle).toHaveBeenCalledWith('pelicula', 1);
  });

  it('devuelve el detalle de una serie', async () => {
    const response = await request(createApp()).get('/api/titulos/serie/2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: detalleSerie });
    expect(tmdbIntegration.obtenerDetalle).toHaveBeenCalledWith('serie', 2);
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
    expect(tmdbIntegration.obtenerDetalle).not.toHaveBeenCalled();
  });

  it('responde 400 cuando el identificador no es un entero positivo', async () => {
    const response = await request(createApp()).get('/api/titulos/pelicula/1.5');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION');
    expect(tmdbIntegration.obtenerDetalle).not.toHaveBeenCalled();
  });

  it('responde 502 cuando TMDB falla', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    tmdbIntegration.obtenerDetalle.mockRejectedValueOnce(
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
    tmdbIntegration.obtenerDetalle.mockRejectedValueOnce(
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
    tmdbIntegration.obtenerDetalle.mockResolvedValueOnce({ id: 1 });

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
        ofertas: [
          {
            tipoOferta: 'suscripcion',
            plataformas: [
              {
                id: 1,
                tmdbProviderId: 8,
                nombre: 'Netflix',
                logoPath: '/netflix.jpg',
                urlHome: 'https://www.netflix.com',
                deepLink: null,
              },
              {
                id: 2,
                tmdbProviderId: 119,
                nombre: 'Amazon Prime Video',
                logoPath: '/prime.jpg',
                urlHome: 'https://www.primevideo.com',
                deepLink: null,
              },
            ],
          },
        ],
        enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
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
        ofertas: [
          {
            tipoOferta: 'suscripcion',
            plataformas: [
              {
                id: 3,
                tmdbProviderId: 337,
                nombre: 'Disney Plus',
                logoPath: '/disney.jpg',
                urlHome: 'https://www.disneyplus.com',
                deepLink: null,
              },
            ],
          },
        ],
        enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
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
        ofertas: [],
        enlaceTmdb: null,
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
    expect(response.body).toEqual({
      data: { region: 'AR', ofertas: [], enlaceTmdb: null },
    });
  });

  it('separa las plataformas según la modalidad de oferta', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValueOnce({
      AR: {
        enlaceTmdb: null,
        ofertas: [
          { tmdbProviderId: 8, tipoOferta: 'suscripcion', logoPath: null },
          { tmdbProviderId: 337, tipoOferta: 'con_anuncios', logoPath: '/disney.jpg' },
        ],
      },
    });

    const response = await request(createApp()).get('/api/titulos/pelicula/1/disponibilidad');

    expect(response.status).toBe(200);
    expect(response.body.data.ofertas).toEqual([
      {
        tipoOferta: 'suscripcion',
        plataformas: [expect.objectContaining({ id: 1, nombre: 'Netflix' })],
      },
      {
        tipoOferta: 'con_anuncios',
        plataformas: [expect.objectContaining({ id: 3, nombre: 'Disney Plus' })],
      },
    ]);
  });

  it('incluye el deep link de cada plataforma en su oferta', async () => {
    const enlaceNetflix = 'https://www.netflix.com/title/50';
    streamingAvailabilityIntegration.obtenerDeepLinks.mockResolvedValueOnce([
      { servicio: 'netflix', tipoOferta: 'suscripcion', deepLink: enlaceNetflix },
    ]);

    const response = await request(createApp()).get('/api/titulos/pelicula/50/disponibilidad');

    expect(response.status).toBe(200);
    expect(response.body.data.ofertas[0].plataformas).toEqual([
      expect.objectContaining({ nombre: 'Netflix', deepLink: enlaceNetflix }),
      expect.objectContaining({ nombre: 'Amazon Prime Video', deepLink: null }),
    ]);
    expect(streamingAvailabilityIntegration.obtenerDeepLinks).toHaveBeenCalledWith({
      tipo: 'pelicula',
      tmdbId: 50,
      region: 'AR',
    });
  });

  it('sigue mostrando la disponibilidad sin deep links si Streaming Availability falla', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    streamingAvailabilityIntegration.obtenerDeepLinks.mockRejectedValueOnce(
      new ExternalServiceError('Streaming Availability', new Error('HTTP 429')),
    );

    const response = await request(createApp()).get('/api/titulos/pelicula/51/disponibilidad');

    expect(response.status).toBe(200);
    expect(response.body.data.ofertas[0].plataformas).toEqual([
      expect.objectContaining({ nombre: 'Netflix', deepLink: null }),
      expect.objectContaining({ nombre: 'Amazon Prime Video', deepLink: null }),
    ]);

    consoleError.mockRestore();
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

  it('responde 429 cuando una IP supera el límite de consultas de disponibilidad', async () => {
    const app = createApp();
    let response;
    for (let intento = 0; intento <= 30; intento += 1) {
      response = await request(app).get('/api/titulos/pelicula/1/disponibilidad');
      if (response.status === 429) {
        break;
      }
    }

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
    expect(response.headers['retry-after']).toBeDefined();
  });
});

const COOKIE_SESION = 'access_token=access-de-prueba';

describe('GET /api/titulos/:tipo/:tmdbId/disponibilidad/comparacion', () => {
  it('responde 401 cuando la persona no inició sesión y no consulta fuentes externas (Escenario 6)', async () => {
    const response = await request(createApp()).get(
      '/api/titulos/pelicula/1/disponibilidad/comparacion?regiones=US,ES',
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(tmdbIntegration.obtenerOfertas).not.toHaveBeenCalled();
  });

  it('devuelve la disponibilidad comparada en varias regiones válidas (Escenario 1)', async () => {
    const response = await request(createApp())
      .get('/api/titulos/pelicula/1/disponibilidad/comparacion?regiones=AR,US')
      .set('Cookie', COOKIE_SESION);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        regiones: [
          {
            region: 'AR',
            enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
            ofertas: [
              {
                tipoOferta: 'suscripcion',
                plataformas: [
                  expect.objectContaining({ id: 1, nombre: 'Netflix', deepLink: null }),
                  expect.objectContaining({ id: 2, nombre: 'Amazon Prime Video', deepLink: null }),
                ],
              },
            ],
          },
          {
            region: 'US',
            enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
            ofertas: [
              {
                tipoOferta: 'suscripcion',
                plataformas: [
                  expect.objectContaining({ id: 3, nombre: 'Disney Plus', deepLink: null }),
                ],
              },
            ],
          },
        ],
        regionesFallidas: [],
      },
    });
    expect(tmdbIntegration.obtenerOfertas).toHaveBeenCalledTimes(1);
  });

  it('identifica las regiones consultadas sin ofertas cuando no hay disponibilidad (Escenario 2)', async () => {
    const response = await request(createApp())
      .get('/api/titulos/pelicula/1/disponibilidad/comparacion?regiones=ES,MX')
      .set('Cookie', COOKIE_SESION);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        regiones: [
          { region: 'ES', ofertas: [], enlaceTmdb: null },
          { region: 'MX', ofertas: [], enlaceTmdb: null },
        ],
        regionesFallidas: [],
      },
    });
  });

  it('rechaza códigos de región mal formados o no soportados con 400 (Escenario 3)', async () => {
    const response = await request(createApp())
      .get('/api/titulos/pelicula/1/disponibilidad/comparacion?regiones=US,ZZ')
      .set('Cookie', COOKIE_SESION);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION');
    expect(tmdbIntegration.obtenerOfertas).not.toHaveBeenCalled();
  });

  it('rechaza cuando la solicitud supera el máximo de regiones permitido (Escenario 4)', async () => {
    const response = await request(createApp())
      .get('/api/titulos/pelicula/1/disponibilidad/comparacion?regiones=AR,BR,CL,CO,MX,US')
      .set('Cookie', COOKIE_SESION);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION');
    expect(tmdbIntegration.obtenerOfertas).not.toHaveBeenCalled();
  });

  it('conserva los resultados confirmados e identifica la región fallida ante un fallo parcial (Escenario 5)', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValueOnce({
      US: ofertasTmdb.US,
      BR: { enlaceTmdb: null, ofertas: null },
    });

    const response = await request(createApp())
      .get('/api/titulos/pelicula/1/disponibilidad/comparacion?regiones=US,BR')
      .set('Cookie', COOKIE_SESION);

    expect(response.status).toBe(200);
    expect(response.body.data.regiones).toHaveLength(1);
    expect(response.body.data.regiones[0].region).toBe('US');
    expect(response.body.data.regionesFallidas).toEqual(['BR']);
  });

  it('deduplica regiones repetidas en la consulta y devuelve una única entrada (Escenario 7)', async () => {
    const response = await request(createApp())
      .get('/api/titulos/pelicula/1/disponibilidad/comparacion?regiones=US,US')
      .set('Cookie', COOKIE_SESION);

    expect(response.status).toBe(200);
    expect(response.body.data.regiones).toHaveLength(1);
    expect(response.body.data.regiones[0].region).toBe('US');
    expect(tmdbIntegration.obtenerOfertas).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/titulos/:tipo/:tmdbId/disponibilidad/alternativas', () => {
  it('responde 401 sin sesión (Escenario 4)', async () => {
    const response = await request(createApp()).get(
      '/api/titulos/pelicula/1/disponibilidad/alternativas?region=ES',
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(tmdbIntegration.obtenerOfertas).not.toHaveBeenCalled();
  });

  it('devuelve las regiones alternativas disponibles cuando no hay ofertas en la región consultada (Escenario 1)', async () => {
    const response = await request(createApp())
      .get('/api/titulos/pelicula/1/disponibilidad/alternativas?region=ES')
      .set('Cookie', COOKIE_SESION);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        region: 'ES',
        disponibleEnRegionActual: false,
        alternativas: [
          expect.objectContaining({ region: 'AR' }),
          expect.objectContaining({ region: 'US' }),
        ],
      },
    });
  });

  it('devuelve alternativas vacías si el título ya está disponible en la región actual (Escenario 3)', async () => {
    const response = await request(createApp())
      .get('/api/titulos/pelicula/1/disponibilidad/alternativas?region=AR')
      .set('Cookie', COOKIE_SESION);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        region: 'AR',
        disponibleEnRegionActual: true,
        alternativas: [],
      },
    });
  });
});
