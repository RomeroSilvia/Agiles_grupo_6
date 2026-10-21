import { supabaseAdmin } from '../config/supabase.config.js';
import { ConflictError, DatabaseError } from '../errors/index.js';
import { WATCHLIST_PAGE_SIZE } from '../config/watchlist.config.js';
import {
  TITULOS_WATCHLIST_PARA_SINCRONIZAR_COLUMNS,
  fromActiveWatchlistRow,
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

export async function listarTitulosConAvisosActivos(regionPredeterminada) {
  const resultados = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('watchlist_item')
      .select(TITULOS_WATCHLIST_PARA_SINCRONIZAR_COLUMNS)
      .eq('aviso_activo', true)
      .order('titulo_id')
      .order('id')
      .range(desde, desde + WATCHLIST_PAGE_SIZE - 1);

    if (error) {
      throw new DatabaseError(error);
    }

    const pagina = data ?? [];
    resultados.push(...pagina.map((row) => fromActiveWatchlistRow(row, regionPredeterminada)));

    if (pagina.length < WATCHLIST_PAGE_SIZE) {
      return resultados;
    }

    desde += WATCHLIST_PAGE_SIZE;
  }
}

export async function listarPorUsuario(usuarioId, pagina) {
  const desde = (pagina - 1) * WATCHLIST_PAGE_SIZE;
  const hasta = desde + WATCHLIST_PAGE_SIZE - 1;
  const { data, count, error } = await supabaseAdmin
    .from('watchlist_item')
    .select(WATCHLIST_TITULO_COLUMNS, { count: 'exact' })
    .eq('usuario_id', usuarioId)
    .order('agregado_en', { ascending: false })
    .order('id', { ascending: false })
    .range(desde, hasta);

  if (error) {
    lanzarError(error);
  }
  const totalResultados = count ?? 0;
  return {
    resultados: data.map(fromWatchlistRow),
    pagina,
    totalResultados,
    totalPaginas: Math.ceil(totalResultados / WATCHLIST_PAGE_SIZE),
  };
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
