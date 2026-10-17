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
  if (!data) {
    throw new DatabaseError(new Error('No existe la fuente de datos "' + nombre + '"'));
  }

  return data.id;
}
