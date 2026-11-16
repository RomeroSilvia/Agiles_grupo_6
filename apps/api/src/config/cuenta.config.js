import { env } from './env.config.js';
import { crearLimite } from './rateLimit.config.js';

export const COOLDOWN_RECUPERACION = Object.freeze({
  TTL_MS: 60_000,
  MAX_ENTRADAS: 1000,
});

export const MAX_INTENTOS_LOGIN = 5;
export const MINUTOS_BLOQUEO_LOGIN = 15;

export const RATE_LIMIT_RECUPERACION = crearLimite(5, 15);
export const RATE_LIMIT_REGISTRO = crearLimite(10, 15);
export const RATE_LIMIT_INICIO_SESION = crearLimite(10, 15);
export const RATE_LIMIT_ENLACE_CUENTA = crearLimite(10, 15);

export function crearEnlace(ruta, token) {
  const url = new URL(ruta, env.FRONTEND_URL);
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}
