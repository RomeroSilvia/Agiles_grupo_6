import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../errors/index.js';
import * as tituloRepository from '../repositories/titulo.repository.js';
import * as watchlistRepository from '../repositories/watchlist.repository.js';
import * as tituloService from './titulo.service.js';
import * as watchlistService from './watchlist.service.js';

vi.mock('../repositories/titulo.repository.js', () => ({
  obtenerPorTmdbIdYTipo: vi.fn(),
  guardarDesdeTmdb: vi.fn(),
}));

vi.mock('../repositories/watchlist.repository.js', () => ({
  agregar: vi.fn(),
  existe: vi.fn(),
  listarPorUsuario: vi.fn(),
  quitar: vi.fn(),
}));

vi.mock('./titulo.service.js', () => ({
  obtenerDetalleTitulo: vi.fn(),
}));

const usuarioId = 'usuario-1';
const titulo = {
  id: 17,
  tmdbId: 42,
  tipo: 'pelicula',
  nombre: 'Dune',
  posterUrl: null,
  anio: 2021,
  puntuacion: 8.1,
  sinopsis: 'Una familia viaja a Arrakis.',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('watchlistService', () => {
  it('lista solo para el usuario recibido y conserva la paginación', async () => {
    const respuesta = { resultados: [], pagina: 2, totalResultados: 0, totalPaginas: 0 };
    watchlistRepository.listarPorUsuario.mockResolvedValue(respuesta);

    await expect(watchlistService.listarWatchlist(usuarioId, { pagina: 2 })).resolves.toBe(
      respuesta,
    );
    expect(watchlistRepository.listarPorUsuario).toHaveBeenCalledWith(usuarioId, 2);
  });

  it('devuelve agregado falso si el título aún no existe en el catálogo', async () => {
    tituloRepository.obtenerPorTmdbIdYTipo.mockResolvedValue(null);

    await expect(
      watchlistService.obtenerEstadoWatchlist(usuarioId, { tipo: 'pelicula', tmdbId: 42 }),
    ).resolves.toEqual({ agregado: false });
    expect(watchlistRepository.existe).not.toHaveBeenCalled();
  });

  it('resuelve y guarda el título antes de agregarlo a la lista', async () => {
    tituloRepository.obtenerPorTmdbIdYTipo.mockResolvedValue(null);
    tituloService.obtenerDetalleTitulo.mockResolvedValue(titulo);
    tituloRepository.guardarDesdeTmdb.mockResolvedValue(titulo);

    await watchlistService.agregarAWatchlist(usuarioId, { tipo: 'pelicula', tmdbId: 42 });

    expect(tituloService.obtenerDetalleTitulo).toHaveBeenCalledWith({
      tipo: 'pelicula',
      tmdbId: 42,
    });
    expect(tituloRepository.guardarDesdeTmdb).toHaveBeenCalledWith(titulo);
    expect(watchlistRepository.agregar).toHaveBeenCalledWith(usuarioId, titulo.id);
  });

  it('responde como no encontrado si el título no pertenece a la lista del usuario', async () => {
    tituloRepository.obtenerPorTmdbIdYTipo.mockResolvedValue(titulo);
    watchlistRepository.quitar.mockResolvedValue(false);

    await expect(
      watchlistService.quitarDeWatchlist(usuarioId, { tipo: 'pelicula', tmdbId: 42 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(watchlistRepository.quitar).toHaveBeenCalledWith(usuarioId, titulo.id);
  });

  it('propaga errores al consultar la lista para que el handler responda el error', async () => {
    const error = new Error('falló la base');
    watchlistRepository.listarPorUsuario.mockRejectedValue(error);

    await expect(watchlistService.listarWatchlist(usuarioId, { pagina: 1 })).rejects.toBe(error);
  });
});
