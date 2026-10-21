import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { SINCRONIZACION_COLUMNS, fromRow } from '../models/sincronizacion.model.js';

export async function iniciar() {
  const { data, error } = await supabaseAdmin
    .from('sincronizacion')
    .insert({})
    .select(SINCRONIZACION_COLUMNS)
    .single();

  if (error) {
    throw new DatabaseError(error);
  }

  return fromRow(data);
}

export async function reservarConsultaDisponibilidad(sincronizacionId, { inicio, fin, limite }) {
  const { data, error } = await supabaseAdmin.rpc('reservar_cupo_disponibilidad', {
    p_sincronizacion_id: sincronizacionId,
    p_inicio: inicio,
    p_fin: fin,
    p_limite: limite,
  });

  if (error) {
    throw new DatabaseError(error);
  }

  return data;
}

export async function finalizar(id, { finalizadaEn, error: mensajeError }) {
  const { error } = await supabaseAdmin
    .from('sincronizacion')
    .update({
      finalizada_en: finalizadaEn,
      error: mensajeError,
    })
    .eq('id', id);

  if (error) {
    throw new DatabaseError(error);
  }
}
