import { NotFoundError } from '../errors/index.js';
import * as tituloRepository from '../repositories/titulo.repository.js';
import * as watchlistRepository from '../repositories/watchlist.repository.js';
import * as tituloService from './titulo.service.js';

export function listarWatchlist(usuarioId, { pagina }) {
  return watchlistRepository.listarPorUsuario(usuarioId, pagina);
}

export async function obtenerEstadoWatchlist(usuarioId, { tipo, tmdbId }) {
  const titulo = await tituloRepository.obtenerPorTmdbIdYTipo(tmdbId, tipo);
  if (!titulo) {
    return { agregado: false };
  }

  return { agregado: await watchlistRepository.existe(usuarioId, titulo.id) };
}

export async function agregarAWatchlist(usuarioId, { tipo, tmdbId }) {
  let titulo = await tituloRepository.obtenerPorTmdbIdYTipo(tmdbId, tipo);
  if (!titulo) {
    const detalle = await tituloService.obtenerDetalleTitulo({ tipo, tmdbId });
    titulo = await tituloRepository.guardarDesdeTmdb(detalle);
  }

  await watchlistRepository.agregar(usuarioId, titulo.id);
}

export async function quitarDeWatchlist(usuarioId, { tipo, tmdbId }) {
  const titulo = await tituloRepository.obtenerPorTmdbIdYTipo(tmdbId, tipo);
  if (!titulo) {
    throw new NotFoundError('El título no está en tu watchlist');
  }

  const quitado = await watchlistRepository.quitar(usuarioId, titulo.id);
  if (!quitado) {
    throw new NotFoundError('El título no está en tu watchlist');
  }
}
