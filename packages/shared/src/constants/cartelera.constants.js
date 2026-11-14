export const ESTADO_EXHIBICION = Object.freeze({
  CARTELERA_PROVEEDOR: 'cartelera_proveedor',
  PROXIMO_ESTRENO: 'proximo_estreno',
});

export const ESTADOS_EXHIBICION = Object.values(ESTADO_EXHIBICION);

export const ESTADO_FECHA = Object.freeze({
  INFORMADA: 'informada',
  PENDIENTE: 'pendiente',
});

export const ESTADOS_FECHA = Object.values(ESTADO_FECHA);

export const FUENTE_ID_TMDB = 'tmdb';
export const REGION_CARTELERA = 'AR';
export const CARTELERA_CACHE_TTL_MS = 60 * 60 * 1000;
