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

export async function contarTitulosProcesadosEntre(inicio, fin) {
  const { data, error } = await supabaseAdmin
    .from('sincronizacion')
    .select('titulos_procesados')
    .gte('iniciada_en', inicio)
    .lt('iniciada_en', fin);

  if (error) {
    throw new DatabaseError(error);
  }

  return data.reduce((total, ejecucion) => total + ejecucion.titulos_procesados, 0);
}

export async function finalizar(id, { finalizadaEn, titulosProcesados, error: mensajeError }) {
  const { error } = await supabaseAdmin
    .from('sincronizacion')
    .update({
      finalizada_en: finalizadaEn,
      titulos_procesados: titulosProcesados,
      error: mensajeError,
    })
    .eq('id', id);

  if (error) {
    throw new DatabaseError(error);
  }
}
