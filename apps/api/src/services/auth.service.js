import * as authRepository from '../repositories/auth.repository.js';
import * as intentoLoginRepository from '../repositories/intentoLogin.repository.js';
import { TooManyAttemptsError, UnauthenticatedError } from '../errors/index.js';

// Bloqueo temporal del ingreso para frenar ataques de fuerza bruta
export const MAX_INTENTOS_LOGIN = 5;
export const MINUTOS_BLOQUEO_LOGIN = 15;

// Mismo mensaje para mail inexistente y contraseña incorrecta:
// así no se puede averiguar qué mails están registrados.
const CREDENCIALES_INVALIDAS = 'El mail o la contraseña no son correctos';

/**
 * E4HU2: registra al usuario y deja la sesión iniciada.
 * @returns {Promise<import('../repositories/auth.repository.js').Sesion>}
 */
export async function registrarUsuario({ email, password }) {
  await authRepository.crearUsuario(email, password);

  const sesion = await authRepository.iniciarSesionConPassword(email, password);
  if (!sesion) {
    // No debería pasar: el usuario se acaba de crear con esa contraseña
    throw new UnauthenticatedError(
      'Tu cuenta se creó, pero no pudimos iniciar sesión. Probá ingresar.',
    );
  }
  return sesion;
}

/**
 * E4HU2: inicia sesión con mail y contraseña.
 * @returns {Promise<import('../repositories/auth.repository.js').Sesion>}
 */
export async function iniciarSesion({ email, password }) {
  const bloqueadoHasta = await intentoLoginRepository.obtenerBloqueo(email);
  if (bloqueadoHasta) {
    throw new TooManyAttemptsError(bloqueadoHasta);
  }

  const sesion = await authRepository.iniciarSesionConPassword(email, password);
  if (!sesion) {
    const nuevoBloqueo = await intentoLoginRepository.registrarFallido(
      email,
      MAX_INTENTOS_LOGIN,
      MINUTOS_BLOQUEO_LOGIN,
    );
    if (nuevoBloqueo) {
      throw new TooManyAttemptsError(nuevoBloqueo);
    }
    throw new UnauthenticatedError(CREDENCIALES_INVALIDAS);
  }

  await intentoLoginRepository.limpiar(email);
  return sesion;
}

/**
 * Resuelve el usuario a partir de las cookies. Si el access token venció pero
 * el refresh token sigue siendo válido, devuelve también la sesión renovada
 * para que el controller actualice las cookies.
 *
 * @returns {Promise<{ user: import('../repositories/auth.repository.js').UsuarioSesion | null, sesionRenovada?: import('../repositories/auth.repository.js').Sesion }>}
 */
export async function obtenerSesion({ accessToken, refreshToken }) {
  if (accessToken) {
    const user = await authRepository.obtenerUsuarioPorToken(accessToken);
    if (user) {
      return { user };
    }
  }

  if (refreshToken) {
    const sesionRenovada = await renovarSesion(refreshToken);
    if (sesionRenovada) {
      return { user: sesionRenovada.user, sesionRenovada };
    }
  }

  return { user: null };
}

/**
 * Cierra la sesión de este dispositivo revocando su refresh token. Si el access token
 * venció, primero lo renueva: Supabase necesita un access token válido para revocar.
 */
export async function cerrarSesion({ accessToken, refreshToken }) {
  if (accessToken && (await authRepository.cerrarSesion(accessToken))) {
    return;
  }

  const sesion = refreshToken ? await renovarSesion(refreshToken) : null;
  if (sesion) {
    await authRepository.cerrarSesion(sesion.accessToken);
  }
}

// Renovaciones en curso por refresh token. Si llegan dos requests a la vez con el mismo
// refresh token, el segundo espera la renovación del primero en lugar de usar un token que
// Supabase ya rotó. (Entre instancias distintas de la API lo cubre el intervalo de reuso
// del refresh token que tiene Supabase, 10 segundos por defecto.)
const renovacionesEnCurso = new Map();

function renovarSesion(refreshToken) {
  let renovacion = renovacionesEnCurso.get(refreshToken);
  if (!renovacion) {
    renovacion = authRepository
      .refrescarSesion(refreshToken)
      .finally(() => renovacionesEnCurso.delete(refreshToken));
    renovacionesEnCurso.set(refreshToken, renovacion);
  }
  return renovacion;
}
