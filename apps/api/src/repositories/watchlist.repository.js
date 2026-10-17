import { supabaseAdmin } from '../config/supabase.config.js';
import { ConflictError, DatabaseError } from '../errors/index.js';
import {
  fromWatchlistRow,
  WATCHLIST_PRIMARY_KEY,
  WATCHLIST_TITULO_COLUMNS,
} from '../models/watchlist.model.js';

function lanzarError(error) {
  if (error.code === '23505') {
    throw new ConflictError('El título ya está en tu watchlist');
  }
  throw new DatabaseError(error);
}

export async function listarPorUsuario(usuarioId) {
  const { data, error } = await supabaseAdmin
    .from('watchlist_item')
    .select(WATCHLIST_TITULO_COLUMNS)
    .eq('usuario_id', usuarioId)
    .order('agregado_en', { ascending: false });

  if (error) {
    lanzarError(error);
  }
  return data.map(fromWatchlistRow);
}

export async function existe(usuarioId, tituloId) {
  const { data, error } = await supabaseAdmin
    .from('watchlist_item')
    .select('id')
    .eq('usuario_id', usuarioId)
    .eq('titulo_id', tituloId)
    .maybeSingle();

  if (error) {
    lanzarError(error);
  }
  return data !== null;
}

export async function agregar(usuarioId, tituloId) {
  const { error } = await supabaseAdmin
    .from('watchlist_item')
    .upsert(
      { usuario_id: usuarioId, titulo_id: tituloId },
      { onConflict: WATCHLIST_PRIMARY_KEY, ignoreDuplicates: true },
    );

  if (error) {
    lanzarError(error);
  }
}

export async function quitar(usuarioId, tituloId) {
  const { data, error } = await supabaseAdmin
    .from('watchlist_item')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('titulo_id', tituloId)
    .select('id')
    .maybeSingle();

  if (error) {
    lanzarError(error);
  }
  return data !== null;
}
