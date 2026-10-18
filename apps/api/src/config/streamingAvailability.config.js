import { TIPO_OFERTA } from '@buscador/shared/constants';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

export const STREAMING_AVAILABILITY_CONFIG = Object.freeze({
  BASE_URL: 'https://streaming-availability.p.rapidapi.com',
  RAPIDAPI_HOST: 'streaming-availability.p.rapidapi.com',
  TIMEOUT_MS: 8000,
  // La API permite 100 requests por día: un deep link guardado se reutiliza durante este tiempo.
  VIGENCIA_DEEP_LINK_MS: 7 * ONE_DAY_MS,
  // Caché en memoria por título y región: evita consultas repetidas, también tras un fallo.
  CACHE_TTL_MS: ONE_HOUR_MS,
  CACHE_MAX_ENTRIES: 5000,
  // La fila de disponibilidad representa la oferta de JustWatch; el deep link la completa.
  FUENTE_DISPONIBILIDAD: 'JustWatch',
  RATE_LIMIT_DISPONIBILIDAD: Object.freeze({ maxRequests: 30, windowMs: 60_000 }),
});

// Servicio de Streaming Availability y dominios válidos para los deep links de cada
// plataforma, según su tmdb_provider_id (ver supabase/seed.sql).
export const SERVICIO_POR_TMDB_PROVIDER_ID = Object.freeze({
  8: { servicio: 'netflix', dominios: ['netflix.com'] },
  119: { servicio: 'prime', dominios: ['primevideo.com', 'amazon.com'] },
  337: { servicio: 'disney', dominios: ['disneyplus.com'] },
  1899: { servicio: 'hbo', dominios: ['hbomax.com', 'max.com'] },
  350: { servicio: 'apple', dominios: ['apple.com'] },
  531: { servicio: 'paramount', dominios: ['paramountplus.com'] },
  283: { servicio: 'crunchyroll', dominios: ['crunchyroll.com'] },
  11: { servicio: 'mubi', dominios: ['mubi.com'] },
});

export const TIPO_OFERTA_POR_TIPO_STREAMING_AVAILABILITY = Object.freeze({
  subscription: TIPO_OFERTA.SUSCRIPCION,
  addon: TIPO_OFERTA.SUSCRIPCION,
  free: TIPO_OFERTA.GRATIS,
  rent: TIPO_OFERTA.ALQUILER,
  buy: TIPO_OFERTA.COMPRA,
});
