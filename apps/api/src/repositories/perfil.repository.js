import { REGION_PATTERN } from '@buscador/shared/constants';
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { PERFIL_REGION_COLUMNS, PERFIL_ROL_COLUMNS, fromRow } from '../models/perfil.model.js';

/** @returns {Promise<{ region?: string | null, rol?: string } | null>} null si no existe el perfil */
async function obtenerPerfil(usuarioId, columnas) {
  const { data, error } = await supabaseAdmin
    .from('perfil')
    .select(columnas)
    .eq('id', usuarioId)
    .maybeSingle();

  if (error) {
    throw new DatabaseError(error);
  }
  return data ? fromRow(data) : null;
}

export async function obtenerRegion(usuarioId) {
  return (await obtenerPerfil(usuarioId, PERFIL_REGION_COLUMNS))?.region ?? null;
}

export async function obtenerRol(usuarioId) {
  return (await obtenerPerfil(usuarioId, PERFIL_ROL_COLUMNS))?.rol ?? null;
}

export async function actualizarRegion(usuarioId, region) {
  if (!REGION_PATTERN.test(region)) {
    throw new TypeError(`Región inválida: ${region}`);
  }
  const { data, error } = await supabaseAdmin
    .from('perfil')
    .update({ region })
    .eq('id', usuarioId)
    .or(`region.is.null,region.neq.${region}`)
    .select(PERFIL_REGION_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new DatabaseError(error);
  }
  return data ? fromRow(data).region : null;
}
