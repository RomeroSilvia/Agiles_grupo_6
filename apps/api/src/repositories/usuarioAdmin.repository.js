import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { fromRow } from '../models/usuarioAdmin.model.js';

export async function listarUsuarios({ mail, region, estado, limite, offset }) {
  const { data, error } = await supabaseAdmin.rpc('listar_usuarios_admin', {
    p_email: mail ?? null,
    p_region: region ?? null,
    p_estado: estado ?? null,
    p_limite: limite,
    p_offset: offset,
  });

  if (error) {
    throw new DatabaseError(error);
  }

  return { total: data.total, usuarios: data.usuarios.map(fromRow) };
}
