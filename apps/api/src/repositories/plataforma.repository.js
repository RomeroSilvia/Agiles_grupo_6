import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { PLATAFORMA_COLUMNS, fromRow } from '../models/plataforma.model.js';

export async function listarActivas() {
  const { data, error } = await supabaseAdmin
    .from('plataforma')
    .select(PLATAFORMA_COLUMNS)
    .eq('activa', true)
    .order('nombre');

  if (error) {
    throw new DatabaseError(error);
  }
  return data.map(fromRow);
}

export async function obtenerActivaPorId(id) {
  const { data, error } = await supabaseAdmin
    .from('plataforma')
    .select(PLATAFORMA_COLUMNS)
    .eq('id', id)
    .eq('activa', true)
    .maybeSingle();

  if (error) {
    throw new DatabaseError(error);
  }
  return data ? fromRow(data) : null;
}
