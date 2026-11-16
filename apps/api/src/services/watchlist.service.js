import { ExternalServiceError, NotFoundError } from '../errors/index.js';
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

async function obtenerTituloConGeneros({ tipo, tmdbId }) {
  const titulo = await tituloRepository.obtenerPorTmdbIdYTipo(tmdbId, tipo);
  if (titulo?.generosTmdb) {
    return titulo;
  }

  let detalle;
  try {
    detalle = await tituloService.obtenerDetalleTitulo({ tipo, tmdbId });
  } catch (error) {
    if (!titulo || !(error instanceof ExternalServiceError || error instanceof NotFoundError)) {
      throw error;
    }
    console.warn('No se pudieron completar los géneros del título', error);
    return titulo;
  }
  return tituloRepository.guardarDesdeTmdb(detalle);
}

export async function agregarAWatchlist(usuarioId, { tipo, tmdbId }) {
  const titulo = await obtenerTituloConGeneros({ tipo, tmdbId });
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
