import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from '../config/cookies.config.js';
import * as authService from '../services/auth.service.js';

/**
 * Deja en `req.user` el usuario de la sesión (`{ id, email }`) o `null` si no hay sesión.
 * No corta el request: para exigir sesión usar `requireSession` después de este middleware.
 * Si el access token venció, lo renueva con el refresh token y actualiza las cookies.
 * TODO (optimización): verificar el JWT localmente con las claves públicas (JWKS)
 * del proyecto en lugar de consultar a Supabase en cada request.
 */
export async function loadSession(req, res, next) {
  const accessToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!accessToken && !refreshToken) {
    req.user = null;
    return next();
  }

  const { user, sesionRenovada } = await authService.obtenerSesion({ accessToken, refreshToken });

  if (sesionRenovada) {
    setSessionCookies(res, sesionRenovada);
  } else if (!user) {
    // Cookies vencidas o inválidas: se borran para no reintentar en cada request
    clearSessionCookies(res);
  }

  req.user = user;
  next();
}
