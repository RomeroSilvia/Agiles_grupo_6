// Valores del negocio: deben coincidir con los enums de la base (supabase/migrations).
export const TIPOS_TITULO = ['pelicula', 'serie'];

export const TIPOS_OFERTA = ['suscripcion', 'gratis', 'con_anuncios', 'alquiler', 'compra'];

export const ESTADOS_NOTIFICACION = ['pendiente', 'enviada', 'fallida'];

// Valores técnicos
export const DEFAULT_REGION = 'AR';

// Código de país ISO 3166-1 alfa-2, igual que el CHECK de perfil.region
export const REGION_PATTERN = /^[A-Z]{2}$/;
