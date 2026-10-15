import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { USUARIO_PLATAFORMA_PRIMARY_KEY } from '../models/usuarioPlataforma.model.js';
import { PLATAFORMA_COLUMNS, fromRow as plataformaFromRow } from '../models/plataforma.model.js';

export async function listarPlataformasActivasPorUsuario(usuarioId) {
  const { data, error } = await supabaseAdmin
    .from('usuario_plataforma')
    .select(`plataforma!inner(${PLATAFORMA_COLUMNS})`)
    .eq('usuario_id', usuarioId)
    .eq('plataforma.activa', true);

  if (error) {
    throw new DatabaseError(error);
  }
  return data.map((row) => plataformaFromRow(row.plataforma));
}

export async function agregar(usuarioId, plataformaId) {
  const { error } = await supabaseAdmin
    .from('usuario_plataforma')
    .upsert(
      { usuario_id: usuarioId, plataforma_id: plataformaId },
      { onConflict: USUARIO_PLATAFORMA_PRIMARY_KEY, ignoreDuplicates: true },
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
