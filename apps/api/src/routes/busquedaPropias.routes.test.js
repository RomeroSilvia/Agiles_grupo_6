import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as usuarioPlataformaRepository from '../repositories/usuarioPlataforma.repository.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { ExternalServiceError } from '../errors/index.js';
import { NETFLIX, USUARIO } from '../test/fixtures.js';

vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/usuarioPlataforma.repository.js');
vi.mock('../integrations/tmdb.integration.js', () => ({
  buscarPeliculas: vi.fn(),
  buscarSeries: vi.fn(),
  obtenerOfertas: vi.fn(),
}));

const COOKIE_SESION = 'access_token=access-de-prueba';
const EN_NETFLIX = { AR: [{ tmdbProviderId: 8, tipoOferta: 'suscripcion' }] };
const SIN_OFERTAS = {};

function pelicula(tmdbId, nombre = `Película ${tmdbId}`) {
  return {
    tmdbId,
    tipo: 'pelicula',
    nombre,
    anio: 2021,
    posterUrl: null,
    puntuacion: 7,
    relevancia: 100 - tmdbId,
  };
}

function paginaDeTmdb(resultados, { pagina = 1, totalPaginas = 1 } = {}) {
  return { resultados, pagina, totalResultados: resultados.length, totalPaginas };
}

function buscarConSesion(query) {
  return request(createApp())
    .get('/api/busqueda/propias')
    .set('Cookie', COOKIE_SESION)
    .query({ tipo: 'pelicula', ...query });
}

function ofertasPorId(ofertas) {
  tmdbIntegration.obtenerOfertas.mockImplementation(async ({ tmdbId }) => {
    const oferta = ofertas[tmdbId];
    if (oferta instanceof Error) {
      throw oferta;
    }
    return oferta ?? SIN_OFERTAS;
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  authRepository.obtenerUsuarioPorToken.mockResolvedValue(USUARIO);
  usuarioPlataformaRepository.listarPlataformasActivasPorUsuario.mockResolvedValue([NETFLIX]);
  ofertasPorId({});
});

describe('GET /api/busqueda/propias', () => {
  it('responde 401 sin sesión y no consulta nada', async () => {
    const res = await request(createApp()).get('/api/busqueda/propias').query({ q: 'Dune' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(usuarioPlataformaRepository.listarPlataformasActivasPorUsuario).not.toHaveBeenCalled();
    expect(tmdbIntegration.buscarPeliculas).not.toHaveBeenCalled();
  });

  it('responde 400 si falta el título', async () => {
    const res = await buscarConSesion({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('devuelve solo los títulos disponibles en las plataformas del usuario', async () => {
    tmdbIntegration.buscarPeliculas.mockResolvedValue(
      paginaDeTmdb([pelicula(1, 'Dune'), pelicula(2, 'Matrix')]),
    );
    ofertasPorId({ 1: EN_NETFLIX });

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      resultados: [
        {
          tmdbId: 1,
          tipo: 'pelicula',
          nombre: 'Dune',
          anio: 2021,
          posterUrl: null,
          puntuacion: 7,
          plataformas: [{ id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: null }],
        },
      ],
      pagina: 1,
      totalPaginas: 1,
      totalResultados: 2,
      verificacionIncompleta: false,
    });
    expect(usuarioPlataformaRepository.listarPlataformasActivasPorUsuario).toHaveBeenCalledWith(
      USUARIO.id,
    );
  });

  it('responde sin resultados y sin consultar TMDB si el usuario no tiene plataformas', async () => {
    usuarioPlataformaRepository.listarPlataformasActivasPorUsuario.mockResolvedValue([]);

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.status).toBe(200);
    expect(res.body.data.resultados).toEqual([]);
    expect(tmdbIntegration.buscarPeliculas).not.toHaveBeenCalled();
    expect(tmdbIntegration.obtenerOfertas).not.toHaveBeenCalled();
  });

  it('lee la página siguiente si faltan resultados y devuelve la última leída', async () => {
    tmdbIntegration.buscarPeliculas.mockImplementation(async ({ pagina }) =>
      paginaDeTmdb([pelicula(pagina * 10)], { pagina, totalPaginas: 5 }),
    );
    ofertasPorId({ 10: EN_NETFLIX, 20: EN_NETFLIX });

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.body.data.resultados.map(({ tmdbId }) => tmdbId)).toEqual([10, 20]);
    expect(res.body.data.pagina).toBe(2);
    expect(res.body.data.totalPaginas).toBe(5);
    expect(tmdbIntegration.buscarPeliculas).toHaveBeenCalledTimes(2);
  });

  it('continúa desde la página pedida', async () => {
    tmdbIntegration.buscarPeliculas.mockImplementation(async ({ pagina }) =>
      paginaDeTmdb([pelicula(pagina * 10)], { pagina, totalPaginas: 5 }),
    );

    const res = await buscarConSesion({ q: 'Dune', pagina: 3 });

    expect(res.body.data.pagina).toBe(4);
    expect(tmdbIntegration.buscarPeliculas.mock.calls.map(([{ pagina }]) => pagina)).toEqual([
      3, 4,
    ]);
  });

  it('no lee páginas que TMDB no tiene', async () => {
    tmdbIntegration.buscarPeliculas.mockResolvedValue(paginaDeTmdb([pelicula(1)]));

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.body.data.pagina).toBe(1);
    expect(tmdbIntegration.buscarPeliculas).toHaveBeenCalledTimes(1);
  });

  it('usa las ofertas de la región del usuario', async () => {
    tmdbIntegration.buscarPeliculas.mockResolvedValue(paginaDeTmdb([pelicula(1)]));
    ofertasPorId({ 1: { MX: EN_NETFLIX.AR } });

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.status).toBe(200);
    expect(res.body.data.resultados).toEqual([]);
  });

  it('descarta el título que no se pudo verificar y lo informa', async () => {
    tmdbIntegration.buscarPeliculas.mockResolvedValue(paginaDeTmdb([pelicula(1), pelicula(2)]));
    ofertasPorId({ 1: new ExternalServiceError('TMDB', new Error('caída')), 2: EN_NETFLIX });

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.status).toBe(200);
    expect(res.body.data.resultados.map(({ tmdbId }) => tmdbId)).toEqual([2]);
    expect(res.body.data.verificacionIncompleta).toBe(true);
  });

  it('informa la verificación incompleta aunque ningún título verificado coincida', async () => {
    tmdbIntegration.buscarPeliculas.mockResolvedValue(paginaDeTmdb([pelicula(1), pelicula(2)]));
    ofertasPorId({ 1: new ExternalServiceError('TMDB', new Error('caída')) });

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.status).toBe(200);
    expect(res.body.data.resultados).toEqual([]);
    expect(res.body.data.verificacionIncompleta).toBe(true);
  });

  it('responde 502 si no se pudo verificar ningún título', async () => {
    tmdbIntegration.buscarPeliculas.mockResolvedValue(paginaDeTmdb([pelicula(1), pelicula(2)]));
    tmdbIntegration.obtenerOfertas.mockRejectedValue(
      new ExternalServiceError('TMDB', new Error('caída')),
    );

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE');
  });

  it('responde 502 si falla la búsqueda en TMDB', async () => {
    tmdbIntegration.buscarPeliculas.mockRejectedValue(
      new ExternalServiceError('TMDB', new Error('caída')),
    );

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE');
  });

  it('no responde la búsqueda sin filtrar en esta ruta', async () => {
    tmdbIntegration.buscarPeliculas.mockResolvedValue(paginaDeTmdb([pelicula(1)]));

    const res = await buscarConSesion({ q: 'Dune' });

    expect(res.body.data.resultados).toEqual([]);
  });
});
