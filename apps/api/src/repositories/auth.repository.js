import { supabaseAdmin, createAuthClient } from '../config/supabase.config.js';
import { ConflictError, ExternalServiceError } from '../errors/index.js';

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

// Los errores 4xx de Supabase Auth son del usuario (token vencido, credenciales, etc.);
// el resto significa que el servicio falló.
function esErrorDelCliente(error) {
  return typeof error.status === 'number' && error.status >= 400 && error.status < 500;
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
    throw new ExternalServiceError('de autenticación', error);
  }
  return toUsuario(data.user);
}

/**
 * @returns {Promise<Sesion | null>} null si el mail o la contraseña no coinciden
 */
export async function iniciarSesionConPassword(email, password) {
  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });

  if (error) {
    if (esErrorDelCliente(error)) {
      return null;
    }
    throw new ExternalServiceError('de autenticación', error);
  }
  return toSesion(data.session);
}

/** @returns {Promise<UsuarioSesion | null>} null si el token no es válido o venció */
export async function obtenerUsuarioPorToken(accessToken) {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error) {
    if (esErrorDelCliente(error)) {
      return null;
    }
    throw new ExternalServiceError('de autenticación', error);
  }
  return toUsuario(data.user);
}

/** @returns {Promise<Sesion | null>} null si el refresh token no es válido */
export async function refrescarSesion(refreshToken) {
  const { data, error } = await createAuthClient().auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    if (esErrorDelCliente(error)) {
      return null;
    }
    throw new ExternalServiceError('de autenticación', error);
  }
  return data.session ? toSesion(data.session) : null;
}

/** Invalida el refresh token de esta sesión (solo este dispositivo). */
export async function cerrarSesion(accessToken) {
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken, 'local');

  if (error && !esErrorDelCliente(error)) {
    throw new ExternalServiceError('de autenticación', error);
  }
}
