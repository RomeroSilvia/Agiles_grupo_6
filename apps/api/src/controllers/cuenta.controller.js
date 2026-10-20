import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from '../config/cookies.config.js';
import * as cuentaService from '../services/cuenta.service.js';

function tokensDeSesion(req) {
  return {
    accessToken: req.cookies?.[ACCESS_TOKEN_COOKIE],
    refreshToken: req.cookies?.[REFRESH_TOKEN_COOKIE],
  };
}

export function solicitarRecuperacion(req, res) {
  cuentaService.solicitarRecuperacion(req.validated.body);
  res.status(202).end();
}

export async function restablecerPassword(req, res) {
  await cuentaService.restablecerPassword(req.validated.body);
  res.status(204).end();
}

export async function cambiarPassword(req, res) {
  const sesion = await cuentaService.cambiarPassword(
    req.user,
    req.validated.body,
    tokensDeSesion(req),
  );
  setSessionCookies(res, sesion);
  res.status(204).end();
}

export async function solicitarCambioMail(req, res) {
  await cuentaService.solicitarCambioMail(req.user, req.validated.body);
  res.status(202).end();
}

export async function confirmarCambioMail(req, res) {
  const { user, sesion } = await cuentaService.confirmarCambioMail(req.validated.body);
  if (sesion && req.user?.id === user.id) {
    setSessionCookies(res, sesion);
  }
  res.json({ data: { email: user.email } });
}

export async function eliminarCuenta(req, res) {
  await cuentaService.eliminarCuenta(req.user, req.validated.body, tokensDeSesion(req));
  clearSessionCookies(res);
  res.status(204).end();
}
