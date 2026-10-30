import { TIPO_OFERTA } from '@buscador/shared/constants';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

export const STREAMING_AVAILABILITY_CONFIG = Object.freeze({
  BASE_URL: 'https://streaming-availability.p.rapidapi.com/shows/',
  RAPIDAPI_HOST: 'streaming-availability.p.rapidapi.com',
  TIMEOUT_MS: 8000,
  MAX_REQUESTS_PER_DAY: 100,
  MAX_CONCURRENT_REQUESTS: 4,
  TMDB_PROVIDER_ID_POR_SERVICIO: Object.freeze({
    netflix: 8,
    prime: 119,
    disney: 337,
    hbo: 1899,
    apple: 350,
    paramount: 531,
    crunchyroll: 283,
    mubi: 11,
  }),
  TIPO_OFERTA_POR_TIPO: Object.freeze({
    subscription: TIPO_OFERTA.SUSCRIPCION,
    free: TIPO_OFERTA.GRATIS,
    rent: TIPO_OFERTA.ALQUILER,
    buy: TIPO_OFERTA.COMPRA,
  }),
  // Un deep link guardado se reutiliza durante este plazo.
  VIGENCIA_DEEP_LINK_MS: 7 * ONE_DAY_MS,
  // Evita consultas repetidas en memoria, incluso cuando el proveedor falla.
  CACHE_TTL_MS: ONE_HOUR_MS,
  CACHE_MAX_ENTRIES: 5000,
  // La disponibilidad se obtiene de JustWatch; Streaming Availability completa el enlace.
  FUENTE_DISPONIBILIDAD: 'JustWatch',
  RATE_LIMIT_DISPONIBILIDAD: Object.freeze({ maxRequests: 30, windowMs: 60_000 }),
  RATE_LIMIT_COMPARACION: Object.freeze({ maxRequests: 15, windowMs: 60_000 }),
});

// Servicios y dominios válidos según el tmdb_provider_id de supabase/seed.sql.
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

// Se descartan los add-ons porque pueden requerir un pago extra.
export const TIPO_OFERTA_POR_TIPO_STREAMING_AVAILABILITY = Object.freeze({
  subscription: TIPO_OFERTA.SUSCRIPCION,
  free: TIPO_OFERTA.GRATIS,
  rent: TIPO_OFERTA.ALQUILER,
  buy: TIPO_OFERTA.COMPRA,
});
