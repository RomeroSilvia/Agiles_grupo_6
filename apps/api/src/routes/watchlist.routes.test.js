import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { NotFoundError } from '../errors/index.js';
import * as watchlistService from '../services/watchlist.service.js';

vi.mock('../middlewares/loadSession.middleware.js', () => ({
  loadSession: vi.fn((req, _res, next) => {
    const usuarioId = req.headers['x-usuario-id'];
    req.user = usuarioId ? { id: usuarioId, email: 'persona@example.com' } : null;
    next();
  }),
}));

vi.mock('../services/watchlist.service.js', () => ({
  agregarAWatchlist: vi.fn(),
  listarWatchlist: vi.fn(),
  obtenerEstadoWatchlist: vi.fn(),
  quitarDeWatchlist: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('rutas de watchlist', () => {
  it('rechaza consultar la lista sin sesión', async () => {
    const respuesta = await request(createApp()).get('/api/watchlist');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.code).toBe('UNAUTHENTICATED');
    expect(watchlistService.listarWatchlist).not.toHaveBeenCalled();
  });

  it('lista usando el usuario de la sesión y la página validada', async () => {
    const datos = { resultados: [], pagina: 2, totalResultados: 0, totalPaginas: 0 };
    watchlistService.listarWatchlist.mockResolvedValue(datos);

    const respuesta = await request(createApp())
      .get('/api/watchlist?pagina=2')
      .set('x-usuario-id', 'usuario-7');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ data: datos });
    expect(watchlistService.listarWatchlist).toHaveBeenCalledWith('usuario-7', { pagina: 2 });
  });

  it('agrega un título autenticado y transforma su identificador', async () => {
    const respuesta = await request(createApp())
      .put('/api/watchlist/pelicula/42')
      .set('x-usuario-id', 'usuario-7');

    expect(respuesta.status).toBe(204);
    expect(watchlistService.agregarAWatchlist).toHaveBeenCalledWith('usuario-7', {
      tipo: 'pelicula',
      tmdbId: 42,
    });
  });

  it('responde 404 si el título no está en la lista de esa sesión', async () => {
    watchlistService.quitarDeWatchlist.mockRejectedValue(new NotFoundError());

    const respuesta = await request(createApp())
      .delete('/api/watchlist/serie/42')
      .set('x-usuario-id', 'usuario-7');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.code).toBe('NOT_FOUND');
    expect(watchlistService.quitarDeWatchlist).toHaveBeenCalledWith('usuario-7', {
      tipo: 'serie',
      tmdbId: 42,
    });
  });

  it('rechaza identificadores inválidos antes de llamar al servicio', async () => {
    const respuesta = await request(createApp())
      .put('/api/watchlist/pelicula/0')
      .set('x-usuario-id', 'usuario-7');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.code).toBe('VALIDATION');
    expect(watchlistService.agregarAWatchlist).not.toHaveBeenCalled();
  });
});
