// Valores del negocio: deben coincidir con los enums de la base (supabase/migrations).
export const TIPO_TITULO = Object.freeze({
  PELICULA: 'pelicula',
  SERIE: 'serie',
});

export const TIPOS_TITULO = Object.values(TIPO_TITULO);

// Límites técnicos del formulario de búsqueda.
export const ANIO_MINIMO = 1888;
export const ANIO_MAXIMO = 2100;
export const PAGINA_MAXIMA = 500;

export const TIPO_OFERTA = Object.freeze({
  SUSCRIPCION: 'suscripcion',
  GRATIS: 'gratis',
  CON_ANUNCIOS: 'con_anuncios',
  ALQUILER: 'alquiler',
  COMPRA: 'compra',
});

export const TIPOS_OFERTA = Object.values(TIPO_OFERTA);

export const TIPOS_OFERTA_INCLUIDOS = Object.freeze([
  TIPO_OFERTA.SUSCRIPCION,
  TIPO_OFERTA.GRATIS,
  TIPO_OFERTA.CON_ANUNCIOS,
]);

export const ESTADOS_NOTIFICACION = ['pendiente', 'enviada', 'fallida'];

// Valores técnicos
export const DEFAULT_REGION = 'AR';

export const REGION_SOURCE = Object.freeze({ PROFILE: 'profile', IP: 'ip', DEFAULT: 'default' });
export const REGION_SOURCES = Object.values(REGION_SOURCE);

// Código de país ISO 3166-1 alfa-2, igual que el CHECK de perfil.region
export const REGION_PATTERN = /^[A-Z]{2}$/;

export const TMDB_LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w92';
