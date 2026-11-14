import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { PERFIL_COLUMNS, fromRow } from '../models/perfil.model.js';

/** @returns {Promise<{ region: string | null, rol: string } | null>} null si no existe el perfil */
async function obtenerPerfil(usuarioId) {
  const { data, error } = await supabaseAdmin
    .from('perfil')
    .select(PERFIL_COLUMNS)
    .eq('id', usuarioId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError(error);
  }
  return data ? fromRow(data) : null;
}

export async function obtenerRegion(usuarioId) {
  return (await obtenerPerfil(usuarioId))?.region ?? null;
}

export async function obtenerRol(usuarioId) {
  return (await obtenerPerfil(usuarioId))?.rol ?? null;
}

export async function actualizarRegion(usuarioId, region) {
  const { data, error } = await supabaseAdmin
    .from('perfil')
    .update({ region })
    .eq('id', usuarioId)
    .or(`region.is.null,region.neq.${region}`)
    .select(PERFIL_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new DatabaseError(error);
  }
  return data ? fromRow(data).region : null;
}
