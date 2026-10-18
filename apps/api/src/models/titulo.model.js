import { z } from 'zod';
import { TIPOS_TITULO } from '@buscador/shared/constants';

export const TITULO_COLUMNS =
  'id, tmdb_id, tipo, nombre, anio, sinopsis, poster_path, puntuacion, actualizado_en';
export const TITULO_PRIMARY_KEY = 'tmdb_id,tipo';

const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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
});
