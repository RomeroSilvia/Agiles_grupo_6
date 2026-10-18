import { supabaseAdmin } from '../config/supabase.config.js';
import { ConflictError, DatabaseError } from '../errors/index.js';
import { fromRow, TITULO_COLUMNS, TITULO_PRIMARY_KEY } from '../models/titulo.model.js';

const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

function toRow(titulo) {
  const posterPath = titulo.posterUrl?.startsWith(TMDB_POSTER_BASE_URL)
    ? titulo.posterUrl.slice(TMDB_POSTER_BASE_URL.length)
    : null;

  return {
    tmdb_id: titulo.tmdbId,
    tipo: titulo.tipo,
    nombre: titulo.nombre ?? 'Título no disponible',
    anio: titulo.anio,
    sinopsis: titulo.sinopsis,
    poster_path: posterPath,
    puntuacion: titulo.puntuacion,
    actualizado_en: new Date().toISOString(),
  };
}

function lanzarError(error) {
  if (error.code === '23505') {
    throw new ConflictError('El título ya existe');
  }
  throw new DatabaseError(error);
}

export async function obtenerPorTmdbIdYTipo(tmdbId, tipo) {
  const { data, error } = await supabaseAdmin
    .from('titulo')
    .select(TITULO_COLUMNS)
    .eq('tmdb_id', tmdbId)
    .eq('tipo', tipo)
    .maybeSingle();

  if (error) {
    lanzarError(error);
  }
  return data ? fromRow(data) : null;
}

export async function guardarDesdeTmdb(titulo) {
  const { data, error } = await supabaseAdmin
    .from('titulo')
    .upsert(toRow(titulo), { onConflict: TITULO_PRIMARY_KEY })
    .select(TITULO_COLUMNS)
    .single();

  if (error) {
    lanzarError(error);
  }
  return fromRow(data);
}
