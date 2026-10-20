import { env } from './env.config.js';

export const COOLDOWN_RECUPERACION = Object.freeze({
  TTL_MS: 60_000,
  MAX_ENTRADAS: 1000,
});

export function crearEnlace(ruta, token) {
  const url = new URL(ruta, env.FRONTEND_URL);
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}
