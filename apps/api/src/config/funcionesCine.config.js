export const FUNCIONES_CINE_CONFIG = Object.freeze({
  VERSION_MAPEOS: '1',
  RATE_LIMIT: Object.freeze({ maxRequests: 5, windowMs: 60_000 }),
  MAX_CONCURRENT_REQUESTS: 2,
  MAX_FUNCIONES: 1000,
  SERPAPI_TTL_MS: 3_600_000,
  BUTACA_TTL_MS: 900_000,
  CACHE_MAX_ENTRIES: 100,
});

// Agregar únicamente correspondencias revisadas con evidencia de identidad y municipio.
export const LUGARES_CINE = Object.freeze([]);
export const CORRESPONDENCIAS_PELICULAS_CINE = Object.freeze([]);

// El permiso de los datos y la viabilidad actual siguen pendientes de verificación.
export const BUTACA_VERIFICADO = false;
