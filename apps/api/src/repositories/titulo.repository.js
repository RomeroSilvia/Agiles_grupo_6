import { supabaseAdmin } from '../config/supabase.config.js';
import { throwSupabaseError } from '../utils/supabaseError.js';
import { fromRow, toRow, TITULO_COLUMNS, TITULO_PRIMARY_KEY } from '../models/titulo.model.js';

function lanzarError(error) {
  throwSupabaseError(error, 'El título ya existe');
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
