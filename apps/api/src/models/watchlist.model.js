import { z } from 'zod';
import { TIPOS_TITULO } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';
import { WATCHLIST_PAGE_SIZE } from '../config/watchlist.config.js';

const POSTGRES_INTEGER_MAX = 2_147_483_647;
const WATCHLIST_MAX_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / WATCHLIST_PAGE_SIZE);
const TITULO_INVALIDO = 'El título no es válido';
const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export const WATCHLIST_TITULO_COLUMNS =
  'id, agregado_en, titulo!inner(id, tmdb_id, tipo, nombre, anio, poster_path, puntuacion)';
export const WATCHLIST_PRIMARY_KEY = 'usuario_id,titulo_id';
export const TITULOS_WATCHLIST_PARA_SINCRONIZAR_COLUMNS =
  'titulo!inner(id, tmdb_id, tipo), perfil!inner(region)';

export const watchlistQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1).max(WATCHLIST_MAX_PAGE).default(1),
});

export const watchlistParamsSchema = z.object({
  tipo: z.enum(TIPOS_TITULO),
  tmdbId: z
    .string()
    .regex(/^[1-9]\d{0,9}$/, TITULO_INVALIDO)
    .transform(Number)
    .pipe(z.number().max(POSTGRES_INTEGER_MAX, TITULO_INVALIDO)),
});

const watchlistRowSchema = z.object({
  id: z.number().int().positive(),
  agregado_en: z.string(),
  titulo: z.object({
    id: z.number().int().positive(),
    tmdb_id: z.number().int().positive(),
    tipo: z.enum(TIPOS_TITULO),
    nombre: z.string(),
    anio: z.number().int().nullable(),
    poster_path: z.string().nullable(),
    puntuacion: z.number().nullable(),
  }),
});

export function fromWatchlistRow(row) {
  const data = watchlistRowSchema.parse(row);

  return {
    id: data.id,
    agregadoEn: data.agregado_en,
    titulo: {
      id: data.titulo.id,
      tmdbId: data.titulo.tmdb_id,
      tipo: data.titulo.tipo,
      nombre: data.titulo.nombre,
      anio: data.titulo.anio,
      posterUrl: data.titulo.poster_path
        ? `${TMDB_POSTER_BASE_URL}${data.titulo.poster_path}`
        : null,
      puntuacion: data.titulo.puntuacion,
    },
  };
}

const tituloWatchlistActivoRowSchema = z.object({
  titulo: z.object({
    id: z.number().int().positive(),
    tmdb_id: z.number().int().positive(),
    tipo: z.enum(TIPOS_TITULO),
  }),
  perfil: z.object({ region: regionSchema.nullable() }),
});

export function fromActiveWatchlistRow(row, regionPredeterminada) {
  const data = tituloWatchlistActivoRowSchema.parse(row);

  return {
    tituloId: data.titulo.id,
    tmdbId: data.titulo.tmdb_id,
    tipo: data.titulo.tipo,
    region: data.perfil.region ?? regionPredeterminada,
  };
}
