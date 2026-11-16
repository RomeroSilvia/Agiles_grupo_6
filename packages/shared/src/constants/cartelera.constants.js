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

export const ZONA_HORARIA_AR = 'America/Argentina/Buenos_Aires';

export const FUENTE_ID_TMDB = 'tmdb';
export const FUENTE_ID_BUTACA = 'butaca';

export const COBERTURA_CIUDAD_CINE = Object.freeze({
  DISPONIBLE: 'disponible',
  SIN_VERIFICAR: 'sin_verificar',
  SIN_COBERTURA: 'sin_cobertura',
});

export const ESTADO_FUNCIONES_CINE = Object.freeze({
  DISPONIBLE: 'disponible',
  SIN_FUNCIONES: 'sin_funciones',
  SIN_COBERTURA: 'sin_cobertura',
  INCOMPLETA: 'incompleta',
});
export const REGION_CARTELERA = 'AR';
export const CARTELERA_CACHE_TTL_MS = 60 * 60 * 1000;

export const URL_SITIO_CINEMARK = 'https://www.cinemark.com.ar/';

export const HORIZONTE_FUNCIONES_CINE_DIAS = 7;
export const MAX_FUNCIONES_CINE = 1000;
export const HORIZONTE_ESTRENOS_DIAS = 90;
