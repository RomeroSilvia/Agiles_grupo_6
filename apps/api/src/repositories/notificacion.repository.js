import { supabaseAdmin } from '../config/supabase.config.js';
import { NOTIFICACIONES_CONFIG } from '../config/notificaciones.config.js';
import { DatabaseError } from '../errors/index.js';
import { NOTIFICACION_POR_ENVIAR_COLUMNS, fromRow } from '../models/notificacion.model.js';

const { TAMANO_PAGINA } = NOTIFICACIONES_CONFIG;

/** Avisos pendientes y fallidos que todavía se pueden reintentar, del más viejo al más nuevo. */
export async function listarPorEnviar(maxIntentos) {
  const resultados = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('notificacion')
      .select(NOTIFICACION_POR_ENVIAR_COLUMNS)
      .in('estado', ['pendiente', 'fallida'])
      .lt('intentos', maxIntentos)
      .order('creada_en')
      .order('id')
      .range(desde, desde + TAMANO_PAGINA - 1);

    if (error) {
      throw new DatabaseError(error);
    }

    const pagina = data ?? [];
    resultados.push(...pagina.map(fromRow));

    if (pagina.length < TAMANO_PAGINA) {
      return resultados;
    }

    desde += TAMANO_PAGINA;
  }
}

async function actualizar(ids, cambios) {
  const { error } = await supabaseAdmin.from('notificacion').update(cambios).in('id', ids);

  if (error) {
    throw new DatabaseError(error);
  }
}

export function marcarEnviadas(ids, enviadaEn) {
  return actualizar(ids, { estado: 'enviada', enviada_en: enviadaEn, ultimo_error: null });
}

export function marcarFallidas(ids, { intentos, error }) {
  return actualizar(ids, { estado: 'fallida', intentos, ultimo_error: error });
}

export async function eliminar(ids) {
  const { error } = await supabaseAdmin.from('notificacion').delete().in('id', ids);

  if (error) {
    throw new DatabaseError(error);
  }
}
