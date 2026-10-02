import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';

export async function listarPlataformaIds(usuarioId) {
  const { data, error } = await supabaseAdmin
    .from('usuario_plataforma')
    .select('plataforma_id')
    .eq('usuario_id', usuarioId);

  if (error) {
    throw new DatabaseError(error);
  }
  return data.map((row) => row.plataforma_id);
}

export async function agregar(usuarioId, plataformaId) {
  const { error } = await supabaseAdmin
    .from('usuario_plataforma')
    .upsert(
      { usuario_id: usuarioId, plataforma_id: plataformaId },
      { onConflict: 'usuario_id,plataforma_id', ignoreDuplicates: true },
    );

  if (error) {
    throw new DatabaseError(error);
  }
}

export async function quitar(usuarioId, plataformaId) {
  const { error } = await supabaseAdmin
    .from('usuario_plataforma')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('plataforma_id', plataformaId);

  if (error) {
    throw new DatabaseError(error);
  }
}
