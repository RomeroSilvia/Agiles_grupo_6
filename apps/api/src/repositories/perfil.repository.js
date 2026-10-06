import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { PERFIL_COLUMNS, fromRow } from '../models/perfil.model.js';

export async function obtenerRegion(usuarioId) {
  const { data, error } = await supabaseAdmin
    .from('perfil')
    .select(PERFIL_COLUMNS)
    .eq('id', usuarioId)
    .maybeSingle();

  if (error || !data) {
    throw new DatabaseError(error ?? new Error('No se encontró el perfil del usuario'));
  }
  return fromRow(data).region;
}

export async function guardarRegionSiVacia(usuarioId, region) {
  const { data, error } = await supabaseAdmin
    .from('perfil')
    .update({ region })
    .eq('id', usuarioId)
    .is('region', null)
    .select(PERFIL_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new DatabaseError(error);
  }
  return data ? fromRow(data).region : null;
}
