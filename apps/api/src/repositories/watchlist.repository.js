import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import {
  TITULOS_WATCHLIST_PARA_SINCRONIZAR_COLUMNS,
  fromActiveWatchlistRow,
} from '../models/watchlist.model.js';

export async function listarTitulosConAvisosActivos(regionPredeterminada) {
  const { data, error } = await supabaseAdmin
    .from('watchlist_item')
    .select(TITULOS_WATCHLIST_PARA_SINCRONIZAR_COLUMNS)
    .eq('aviso_activo', true)
    .order('titulo_id');

  if (error) {
    throw new DatabaseError(error);
  }

  return data.map((row) => fromActiveWatchlistRow(row, regionPredeterminada));
}
