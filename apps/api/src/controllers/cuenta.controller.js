import { clearSessionCookies, setSessionCookies } from '../config/cookies.config.js';
import * as cuentaService from '../services/cuenta.service.js';

export function solicitarRecuperacion(req, res) {
  cuentaService.solicitarRecuperacion(req.validated.body);
  res.status(202).end();
}

export async function restablecerPassword(req, res) {
  await cuentaService.restablecerPassword(req.validated.body);
  clearSessionCookies(res);
  res.status(204).end();
}

export async function cambiarPassword(req, res) {
  const sesion = await cuentaService.cambiarPassword(
    req.user,
    req.validated.body,
    req.sessionTokens,
  );
  setSessionCookies(res, sesion);
  res.status(204).end();
}

export async function solicitarCambioMail(req, res) {
  await cuentaService.solicitarCambioMail(req.user, req.validated.body);
  res.status(202).end();
}

export async function confirmarCambioMail(req, res) {
  const { user, sesion } = await cuentaService.confirmarCambioMail(req.validated.body, req.user);
  if (sesion) {
    setSessionCookies(res, sesion);
  }
  res.json({ data: { email: user.email } });
}

export async function eliminarCuenta(req, res) {
  await cuentaService.eliminarCuenta(req.user, req.validated.body, req.sessionTokens);
  clearSessionCookies(res);
  res.status(204).end();
}
