import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';

export async function obtenerIdPorNombre(nombre) {
  const { data, error } = await supabaseAdmin
    .from('fuente_datos')
    .select('id')
    .eq('nombre', nombre)
    .maybeSingle();

  if (error) {
    throw new DatabaseError(error);
  }
  return data?.id ?? null;
}
