import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as carteleraService from '../services/cartelera.service.js';
vi.mock('../services/cartelera.service.js', () => ({
  obtenerExhibicionPelicula: vi.fn(),
  listarPeliculasEnCartelera: vi.fn(),
  listarProximosEstrenos: vi.fn(),
}));
afterEach(() => vi.restoreAllMocks());
describe('GET /api/cartelera/peliculas/:tmdbId/exhibicion', () => {
  it('publica la confirmación sin sesión con un ID validado', async () => {
    carteleraService.obtenerExhibicionPelicula.mockResolvedValue({ consultable: true });
    const response = await request(createApp()).get('/api/cartelera/peliculas/77/exhibicion');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { consultable: true } });
    expect(carteleraService.obtenerExhibicionPelicula).toHaveBeenCalledWith({ tmdbId: 77 });
  });
  it('rechaza identificadores inválidos antes de consultar el servicio', async () => {
    vi.clearAllMocks();
    expect(
      (await request(createApp()).get('/api/cartelera/peliculas/no-valido/exhibicion')).status,
    ).toBe(400);
    expect(carteleraService.obtenerExhibicionPelicula).not.toHaveBeenCalled();
  });
});
