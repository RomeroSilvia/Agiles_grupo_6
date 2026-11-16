import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { toRow } from '../models/registroBusqueda.model.js';

export async function insertar(registro) {
  const { error } = await supabaseAdmin.from('registro_busqueda').insert(toRow(registro));

  if (error) {
    throw new DatabaseError(error);
  }
}
