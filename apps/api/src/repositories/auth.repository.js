import { jwtVerify } from 'jose';
import { isAuthSessionMissingError } from '@supabase/supabase-js';
import { supabaseAdmin, createAuthClient } from '../config/supabase.config.js';
import { JWT_CONFIG, supabaseJwks } from '../config/jwt.config.js';
import { ConflictError, ExternalServiceError, RateLimitError } from '../errors/index.js';

/**
 * @typedef {object} UsuarioSesion
 * @property {string} id
 * @property {string} email
 */

/**
 * @typedef {object} Sesion
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number} expiresIn Segundos hasta que vence el access token
 * @property {UsuarioSesion} user
 */

export const ALCANCE_SESION = Object.freeze({ LOCAL: 'local', GLOBAL: 'global' });

export const TIPO_ENLACE = Object.freeze({
  RECUPERACION: Object.freeze({ generar: 'recovery', verificar: 'recovery' }),
  CAMBIO_MAIL: Object.freeze({ generar: 'email_change_new', verificar: 'email_change' }),
});

/** @returns {Sesion} */
function toSesion(session) {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
    user: toUsuario(session.user),
  };
}

/** @returns {UsuarioSesion} */
function toUsuario(user) {
  return { id: user.id, email: user.email };
}

// Errores de Supabase Auth que significan que el token o la sesión ya no sirven.
// Cualquier otro (429 por límite de solicitudes, 5xx, red) es una falla del servicio:
// no debe borrar las cookies ni contar como intento fallido.
const CODIGOS_SESION_INVALIDA = new Set([
  'bad_jwt',
  'session_not_found',
  'session_expired',
  'refresh_token_not_found',
  'refresh_token_already_used',
  'user_not_found',
  'user_banned',
]);

function esSesionInvalida(error) {
  return (
    CODIGOS_SESION_INVALIDA.has(error.code) ||
    isAuthSessionMissingError(error) ||
    error.status === 401 ||
    error.status === 403
  );
}

function errorDelServicio(error) {
  if (error.status === 429 || error.code === 'over_request_rate_limit') {
    return new RateLimitError(error);
  }
  return new ExternalServiceError('de autenticación', error);
}

/**
 * Crea el usuario con el mail ya confirmado (la HU no pide verificar el mail).
 * El perfil lo crea el trigger `al_crear_usuario` de la base.
 * @returns {Promise<UsuarioSesion>}
 */
export async function crearUsuario(email, password) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.code === 'email_exists') {
      throw new ConflictError('Ese mail ya está registrado. Iniciá sesión o usá otro mail.');
    }
    throw errorDelServicio(error);
  }
  return toUsuario(data.user);
}

/**
 * @returns {Promise<Sesion | null>} null si el mail o la contraseña no coinciden
 */
export async function iniciarSesionConPassword(email, password) {
  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === 'invalid_credentials') {
      return null;
    }
    throw errorDelServicio(error);
  }
  return toSesion(data.session);
}

// Errores de jose que significan que el token no sirve (vencido, mal formado, firmado con
// otra clave o emitido para otro proyecto). Cualquier otro (no se pudieron descargar las
// claves públicas) es una falla del servicio: no debe borrar las cookies.
const CODIGOS_TOKEN_INVALIDO = new Set([
  'ERR_JWT_EXPIRED',
  'ERR_JWT_INVALID',
  'ERR_JWT_CLAIM_VALIDATION_FAILED',
  'ERR_JWS_INVALID',
  'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
  'ERR_JWKS_NO_MATCHING_KEY',
  'ERR_JOSE_ALG_NOT_ALLOWED',
  'ERR_JOSE_NOT_SUPPORTED',
]);

/**
 * Verifica el access token localmente con las claves públicas del proyecto, sin consultar
 * a Supabase Auth en cada request. Contra: una sesión cerrada o un usuario borrado siguen
 * siendo válidos hasta que vence el access token (1 hora por defecto en Supabase).
 * @returns {Promise<UsuarioSesion | null>} null si el token no es válido o venció
 */
export async function obtenerUsuarioPorToken(accessToken) {
  try {
    const { payload } = await jwtVerify(accessToken, supabaseJwks, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      requiredClaims: ['sub', 'exp'],
    });
    return { id: payload.sub, email: payload.email };
  } catch (error) {
    if (CODIGOS_TOKEN_INVALIDO.has(error.code)) {
      return null;
    }
    throw new ExternalServiceError('de autenticación', error);
  }
}

/** @returns {Promise<Sesion | null>} null si el refresh token no es válido */
export async function refrescarSesion(refreshToken) {
  const { data, error } = await createAuthClient().auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    if (esSesionInvalida(error)) {
      return null;
    }
    throw errorDelServicio(error);
  }
  return data.session ? toSesion(data.session) : null;
}

/**
 * Revoca el refresh token de esta sesión (solo este dispositivo).
 * @returns {Promise<boolean>} false si el access token ya no es válido y no se pudo revocar
 */
export async function cerrarSesion(accessToken, alcance = ALCANCE_SESION.LOCAL) {
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken, alcance);

  if (error) {
    if (esSesionInvalida(error)) {
      return false;
    }
    throw errorDelServicio(error);
  }
  return true;
}

export async function generarEnlace(tipo, { email, nuevoEmail }) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: tipo.generar,
    email,
    ...(nuevoEmail && { newEmail: nuevoEmail }),
  });

  if (error) {
    if (error.code === 'user_not_found') {
      return null;
    }
    if (error.code === 'email_exists') {
      throw new ConflictError('No podés usar ese mail. Probá con otro.');
    }
    throw errorDelServicio(error);
  }
  return data.properties.hashed_token;
}

export async function verificarEnlace(tipo, tokenHash) {
  const { data, error } = await createAuthClient().auth.verifyOtp({
    token_hash: tokenHash,
    type: tipo.verificar,
  });

  if (error) {
    if (error.code === 'otp_expired' || esSesionInvalida(error)) {
      return null;
    }
    throw errorDelServicio(error);
  }
  return {
    user: toUsuario(data.user),
    appMetadata: data.user.app_metadata ?? {},
    sesion: data.session ? toSesion(data.session) : null,
  };
}

export async function actualizarUsuario(id, { password, appMetadata }) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    password,
    app_metadata: appMetadata,
  });

  if (error) {
    throw errorDelServicio(error);
  }
}

export async function eliminarUsuario(id) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (error && error.code !== 'user_not_found') {
    throw errorDelServicio(error);
  }
}
