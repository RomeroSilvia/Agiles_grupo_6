import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as tmdb from '../integrations/tmdb.integration.js';
import { obtenerExhibicionPelicula } from './cartelera.service.js';
vi.mock('../integrations/tmdb.integration.js', () => ({
  listarIdsPeliculasEnCartelera: vi.fn(),
  obtenerFechasEstrenoArgentina: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime('2026-11-14T12:00:00Z');
  tmdb.listarIdsPeliculasEnCartelera.mockResolvedValue([]);
});
afterEach(() => vi.useRealTimers());
describe('exhibición consultable en cine', () => {
  it('acepta una película en cartelera incluso si es un reestreno antiguo', async () => {
    tmdb.listarIdsPeliculasEnCartelera.mockResolvedValue([77]);
    expect(await obtenerExhibicionPelicula({ tmdbId: 77 })).toEqual({ consultable: true });
    expect(tmdb.obtenerFechasEstrenoArgentina).not.toHaveBeenCalled();
  });
  it.each([
    [['2026-11-15'], true],
    [['2027-02-12'], true],
    [['2027-02-13'], false],
    [['1999-01-01'], false],
    [[], false],
  ])('clasifica fechas argentinas: %j', async (fechas, consultable) => {
    tmdb.obtenerFechasEstrenoArgentina.mockResolvedValue({ fechas });
    expect(await obtenerExhibicionPelicula({ tmdbId: 77 })).toEqual({ consultable });
  });
  it('propaga la falla del índice sin inventar una confirmación', async () => {
    tmdb.listarIdsPeliculasEnCartelera.mockRejectedValue(new Error('Fuente no disponible'));
    await expect(obtenerExhibicionPelicula({ tmdbId: 77 })).rejects.toThrow('Fuente no disponible');
  });
});
