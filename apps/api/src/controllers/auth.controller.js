import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from '../config/cookies.config.js';
import * as authService from '../services/auth.service.js';

export async function registrar(req, res) {
  const sesion = await authService.registrarUsuario(req.validated.body);
  setSessionCookies(res, sesion);
  res.status(201).json({ data: { user: sesion.user } });
}

export async function iniciarSesion(req, res) {
  const sesion = await authService.iniciarSesion(req.validated.body);
  setSessionCookies(res, sesion);
  res.json({ data: { user: sesion.user } });
}

/**
 * Las cookies se borran aunque falle la revocación: el usuario pidió salir de este dispositivo.
 * El error igual se propaga para que quede registrado y el front se entere.
 */
export async function cerrarSesion(req, res) {
  try {
    await authService.cerrarSesion({
      accessToken: req.cookies?.[ACCESS_TOKEN_COOKIE],
      refreshToken: req.cookies?.[REFRESH_TOKEN_COOKIE],
    });
  } finally {
    clearSessionCookies(res);
  }
  res.status(204).end();
}

/** Sin sesión responde 200 con `data: null`: no es un error, el front solo consulta. */
export function obtenerSesion(req, res) {
  res.json({ data: req.user ? { user: req.user } : null });
}
