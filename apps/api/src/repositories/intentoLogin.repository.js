import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';

/**
 * @returns {Promise<Date | null>} hasta cuándo está bloqueado el mail, o null si no lo está
 */
export async function obtenerBloqueo(email) {
  const { data, error } = await supabaseAdmin
    .from('intento_login')
    .select('bloqueado_hasta')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    throw new DatabaseError(error);
  }
  if (!data?.bloqueado_hasta) {
    return null;
  }
  const bloqueadoHasta = new Date(data.bloqueado_hasta);
  return bloqueadoHasta > new Date() ? bloqueadoHasta : null;
}

/**
 * Suma un intento fallido de forma atómica en la base.
 * @returns {Promise<Date | null>} hasta cuándo quedó bloqueado, o null si todavía no
 */
export async function registrarFallido(email, maxIntentos, minutosBloqueo) {
  const { data, error } = await supabaseAdmin.rpc('registrar_login_fallido', {
    p_email: email,
    p_max_intentos: maxIntentos,
    p_minutos_bloqueo: minutosBloqueo,
  });

  if (error) {
    throw new DatabaseError(error);
  }
  return data ? new Date(data) : null;
}

/** Después de un ingreso correcto el contador vuelve a cero. */
export async function limpiar(email) {
  const { error } = await supabaseAdmin
    .from('intento_login')
    .delete()
    .eq('email', email.toLowerCase());

  if (error) {
    throw new DatabaseError(error);
  }
}
