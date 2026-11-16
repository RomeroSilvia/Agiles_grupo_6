const MS_POR_MINUTO = 60_000;

export const MAX_IPS_REGISTRADAS = 1000;

export function crearLimite(maxRequests, minutos = 1) {
  return Object.freeze({ maxRequests, windowMs: minutos * MS_POR_MINUTO });
}
