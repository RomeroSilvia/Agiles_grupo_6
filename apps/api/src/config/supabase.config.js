import { createClient } from '@supabase/supabase-js';
import { env } from './env.config.js';

const serverOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

/**
 * Cliente con la clave secreta: ignora RLS.
 * Único cliente para acceso a datos y para auth.admin. Compartido por todo el proceso.
 * Como ignora RLS, cada repositorio es responsable de filtrar por usuario.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, serverOptions);

/**
 * Cliente con la clave pública, para operaciones de sesión del usuario
 * (signInWithPassword, refreshSession, recuperación de contraseña).
 * Crear uno NUEVO por request: esos métodos guardan la sesión en la instancia,
 * y una instancia compartida podría mezclar sesiones de distintos usuarios.
 */
export function createAuthClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, serverOptions);
}
