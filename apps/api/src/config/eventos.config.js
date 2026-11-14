export const EVENTOS_CONFIG = Object.freeze({
  CACHE_TTL_MS: 3_600_000,
  CACHE_MAX_ENTRIES: 100,
  TIMEOUT_MS: 120_000,
  MAX_REQUESTS_PER_DAY: 200,
  RATE_LIMIT: Object.freeze({ maxRequests: 10, windowMs: 60_000 }),
});
