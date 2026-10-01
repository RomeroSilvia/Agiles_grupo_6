import { env } from './env.config.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

// El refresh token de Supabase no vence solo; la cookie dura 30 días sin actividad
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Opciones comunes: el front nunca puede leer los tokens desde JavaScript. */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

/**
 * Guarda los tokens de la sesión en cookies httpOnly.
 * @param {import('express').Response} res
 * @param {{ accessToken: string, refreshToken: string, expiresIn: number }} session
 */
export function setSessionCookies(res, session) {
  res.cookie(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...sessionCookieOptions,
    maxAge: session.expiresIn * 1000,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...sessionCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

/** @param {import('express').Response} res */
export function clearSessionCookies(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, sessionCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, sessionCookieOptions);
}
