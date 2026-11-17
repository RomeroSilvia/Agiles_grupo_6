import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { TIPO_TITULO } from '@buscador/shared/constants';
import { createApp } from '../app.js';
import { CRITERIOS_ANIMO } from '../config/animo.config.js';
import { ExternalServiceError } from '../errors/index.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as usuarioPlataformaRepository from '../repositories/usuarioPlataforma.repository.js';
import * as regionService from '../services/region.service.js';
import { NETFLIX, USUARIO } from '../test/fixtures.js';

vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/usuarioPlataforma.repository.js');
vi.mock('../services/region.service.js');
vi.mock('../integrations/tmdb.integration.js', () => ({
  descubrirTitulos: vi.fn(),
  obtenerOfertas: vi.fn(),
}));

const COOKIE_SESION = 'access_token=access-de-prueba';
const COMEDIA = 35;
const TERROR = 27;
const EN_NETFLIX = {
  AR: { enlaceTmdb: null, ofertas: [{ tmdbProviderId: 8, tipoOferta: 'suscripcion' }] },
};

function titulo(tmdbId, { tipo = TIPO_TITULO.PELICULA, relevancia = 10, ...resto } = {}) {
  return {
    tmdbId,
    tipo,
    nombre: `Título ${tmdbId}`,
    posterUrl: null,
    anio: 2020,
    puntuacion: 7.2,
    relevancia,
    generoIds: [COMEDIA],
    fecha: '2020-01-01',
    ...resto,
  };
}

function paginaTmdb(resultados, { pagina = 1, totalPaginas = 1 } = {}) {
  return { resultados, pagina, totalResultados: resultados.length, totalPaginas };
}

function respuestasPorTipo({ peliculas = [], series = [], totalPaginas = 1 } = {}) {
  tmdbIntegration.descubrirTitulos.mockImplementation(async ({ tipo, pagina }) =>
    paginaTmdb(tipo === TIPO_TITULO.PELICULA ? peliculas : series, { pagina, totalPaginas }),
  );
}

function buscar(query) {
  return request(createApp()).get('/api/busqueda/animo').query(query);
}

function buscarEnMisPlataformas(query) {
  return request(createApp())
    .get('/api/busqueda/animo/propias')
    .set('Cookie', COOKIE_SESION)
    .query(query);
}

beforeEach(() => {
  vi.resetAllMocks();
  authRepository.obtenerUsuarioPorToken.mockResolvedValue(USUARIO);
  usuarioPlataformaRepository.listarPlataformasActivasPorUsuario.mockResolvedValue([NETFLIX]);
  regionService.obtenerRegion.mockResolvedValue({ region: 'AR', source: 'profile' });
  tmdbIntegration.obtenerOfertas.mockResolvedValue({});
  respuestasPorTipo();
});

describe('GET /api/busqueda/animo', () => {
  it('busca películas y series con los criterios del estado de ánimo, sin sesión', async () => {
    respuestasPorTipo({
      peliculas: [titulo(1, { relevancia: 5 })],
      series: [titulo(2, { tipo: TIPO_TITULO.SERIE, relevancia: 50 })],
      totalPaginas: 3,
    });

    const res = await buscar({ animo: 'para-reir' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      resultados: [
        {
          tmdbId: 2,
          tipo: 'serie',
          nombre: 'Título 2',
          posterUrl: null,
          anio: 2020,
          puntuacion: 7.2,
        },
        {
          tmdbId: 1,
          tipo: 'pelicula',
          nombre: 'Título 1',
          posterUrl: null,
          anio: 2020,
          puntuacion: 7.2,
        },
      ],
      pagina: 1,
      totalResultados: 2,
      totalPaginas: 3,
    });

    const criterio = CRITERIOS_ANIMO['para-reir'];
    expect(tmdbIntegration.descubrirTitulos).toHaveBeenCalledWith({
      tipo: TIPO_TITULO.PELICULA,
      generoIds: criterio.pelicula.generosIncluidos,
      generosExcluidos: criterio.pelicula.generosExcluidos,
      puntuacionMinima: criterio.puntuacionMinima,
      votosMinimos: criterio.pelicula.votosMinimos,
      pagina: 1,
    });
    expect(tmdbIntegration.descubrirTitulos).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: TIPO_TITULO.SERIE, pagina: 1 }),
    );
  });

  it('pide la página indicada', async () => {
    const res = await buscar({ animo: 'con-tension', pagina: '2' });

    expect(res.status).toBe(200);
    expect(res.body.data.pagina).toBe(2);
    expect(tmdbIntegration.descubrirTitulos).toHaveBeenCalledWith(
      expect.objectContaining({ pagina: 2 }),
    );
  });

  it('descarta títulos con géneros excluidos o fuera de los criterios aunque TMDB los devuelva', async () => {
    respuestasPorTipo({
      peliculas: [
        titulo(1),
        titulo(2, { generoIds: [COMEDIA, TERROR] }),
        titulo(3, { generoIds: [99] }),
        titulo(4, { puntuacion: 5 }),
      ],
    });

    const res = await buscar({ animo: 'para-reir' });

    expect(res.status).toBe(200);
    expect(res.body.data.resultados.map(({ tmdbId }) => tmdbId)).toEqual([1]);
  });

  it('no informa más páginas de las que se pueden pedir', async () => {
    respuestasPorTipo({ peliculas: [titulo(1)], totalPaginas: 900 });

    const res = await buscar({ animo: 'para-pensar' });

    expect(res.body.data.totalPaginas).toBe(500);
  });

  it.each([{}, { animo: 'aburrido' }, { animo: 'para-reir', pagina: '0' }])(
    'responde 400 y no consulta TMDB con un estado inválido (%o)',
    async (query) => {
      const res = await buscar(query);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION');
      expect(tmdbIntegration.descubrirTitulos).not.toHaveBeenCalled();
    },
  );

  it('responde 502 si falla TMDB', async () => {
    tmdbIntegration.descubrirTitulos.mockRejectedValue(
      new ExternalServiceError('TMDB', new Error('caído')),
    );

    const res = await buscar({ animo: 'para-reir' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE');
  });
});

describe('GET /api/busqueda/animo/propias', () => {
  it('responde 401 sin sesión y no consulta TMDB', async () => {
    const res = await request(createApp())
      .get('/api/busqueda/animo/propias')
      .query({ animo: 'para-reir' });

    expect(res.status).toBe(401);
    expect(tmdbIntegration.descubrirTitulos).not.toHaveBeenCalled();
  });

  it('devuelve solo los títulos del estado de ánimo que están en mis plataformas', async () => {
    respuestasPorTipo({ peliculas: [titulo(1), titulo(2, { relevancia: 1 })] });
    tmdbIntegration.obtenerOfertas.mockImplementation(async ({ tmdbId }) =>
      tmdbId === 1 ? EN_NETFLIX : {},
    );

    const res = await buscarEnMisPlataformas({ animo: 'para-reir' });

    expect(res.status).toBe(200);
    expect(res.body.data.resultados).toEqual([
      expect.objectContaining({
        tmdbId: 1,
        plataformas: [{ id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: null }],
      }),
    ]);
    expect(res.body.data.verificacionIncompleta).toBe(false);
  });

  it('lee la página siguiente si en la primera no hay títulos en mis plataformas', async () => {
    tmdbIntegration.descubrirTitulos.mockImplementation(async ({ tipo, pagina }) =>
      paginaTmdb(tipo === TIPO_TITULO.PELICULA ? [titulo(pagina)] : [], {
        pagina,
        totalPaginas: 5,
      }),
    );
    tmdbIntegration.obtenerOfertas.mockImplementation(async ({ tmdbId }) =>
      tmdbId === 2 ? EN_NETFLIX : {},
    );

    const res = await buscarEnMisPlataformas({ animo: 'para-reir' });

    expect(res.status).toBe(200);
    expect(res.body.data.pagina).toBe(2);
    expect(res.body.data.resultados.map(({ tmdbId }) => tmdbId)).toEqual([2]);
  });

  it('responde sin resultados y sin consultar TMDB si el usuario no tiene plataformas', async () => {
    usuarioPlataformaRepository.listarPlataformasActivasPorUsuario.mockResolvedValue([]);

    const res = await buscarEnMisPlataformas({ animo: 'para-reir' });

    expect(res.status).toBe(200);
    expect(res.body.data.resultados).toEqual([]);
    expect(tmdbIntegration.descubrirTitulos).not.toHaveBeenCalled();
  });

  it('responde 400 con un estado inválido', async () => {
    const res = await buscarEnMisPlataformas({ animo: 'aburrido' });

    expect(res.status).toBe(400);
    expect(tmdbIntegration.descubrirTitulos).not.toHaveBeenCalled();
  });

  it('responde 502 si no se pudo verificar ningún título', async () => {
    respuestasPorTipo({ peliculas: [titulo(1)] });
    tmdbIntegration.obtenerOfertas.mockRejectedValue(
      new ExternalServiceError('TMDB', new Error('caído')),
    );

    const res = await buscarEnMisPlataformas({ animo: 'para-reir' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE');
  });
});
