import { crearLimite } from './rateLimit.config.js';

export const EVENTOS_CONFIG = Object.freeze({
  ALLEVENTS_URL: 'https://api.api.sh/allevents/v1/events',
  ALLEVENTS_CIUDAD: 'la-plata',
  MAX_CONCURRENT_REQUESTS: 2,
  CACHE_TTL_MS: 3_600_000,
  CACHE_MAX_ENTRIES: 100,
  TIMEOUT_MS: 120_000,
  MAX_REQUESTS_PER_DAY: 200,
  FIRST_PAGE_RESERVED_REQUESTS: 50,
  RATE_LIMIT: crearLimite(10),
});
