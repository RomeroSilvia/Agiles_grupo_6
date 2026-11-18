import { z } from 'zod';
import { TIPOS_TITULO } from '@buscador/shared/constants';
import { TMDB_CONFIG } from '../config/tmdb.config.js';

export const TITULO_COLUMNS =
  'id, tmdb_id, tipo, nombre, anio, sinopsis, poster_path, puntuacion, generos_tmdb, actualizado_en';
export const TITULO_PRIMARY_KEY = 'tmdb_id,tipo';

const TMDB_POSTER_BASE_URL = TMDB_CONFIG.POSTER_BASE_URL;
const NOMBRE_NO_DISPONIBLE = 'Título no disponible';

export function toRow(titulo) {
  const posterPath = titulo.posterUrl?.startsWith(TMDB_POSTER_BASE_URL)
    ? titulo.posterUrl.slice(TMDB_POSTER_BASE_URL.length)
    : null;

  return {
    tmdb_id: titulo.tmdbId,
    tipo: titulo.tipo,
    nombre: titulo.nombre ?? NOMBRE_NO_DISPONIBLE,
    anio: titulo.anio,
    sinopsis: titulo.sinopsis,
    poster_path: posterPath,
    puntuacion: titulo.puntuacion,
    generos_tmdb: titulo.generosTmdb ?? null,
    actualizado_en: new Date().toISOString(),
  };
}

export function fromRow(row) {
  return {
    id: row.id,
    tmdbId: row.tmdb_id,
    tipo: row.tipo,
    nombre: row.nombre,
    anio: row.anio,
    sinopsis: row.sinopsis,
    posterUrl: row.poster_path ? `${TMDB_POSTER_BASE_URL}${row.poster_path}` : null,
    puntuacion: row.puntuacion,
    generosTmdb: row.generos_tmdb ?? null,
    actualizadoEn: row.actualizado_en,
  };
}

export const tituloSchema = z.object({
  tmdbId: z.number().int().positive(),
  tipo: z.enum(TIPOS_TITULO),
  nombre: z.string().nullable(),
  sinopsis: z.string().nullable(),
  posterUrl: z.url().nullable(),
  anio: z.number().int().nullable(),
  puntuacion: z.number().min(0).max(10).nullable(),
  generosTmdb: z.array(z.number().int().positive()).nullable().default(null),
});
