import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { fromRow } from '../models/metricas.model.js';

export async function obtenerMetricas({ desde, generos }) {
  const { data, error } = await supabaseAdmin.rpc('obtener_metricas_admin', {
    p_desde: desde,
    p_generos: generos,
  });

  if (error) {
    throw new DatabaseError(error);
  }

  return fromRow(data);
}
