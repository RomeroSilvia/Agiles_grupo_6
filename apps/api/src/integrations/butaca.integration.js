import { env } from '../config/env.config.js';
import { BUTACA_VERIFICADO, FUNCIONES_CINE_CONFIG } from '../config/funcionesCine.config.js';
import { ExternalServiceError } from '../errors/index.js';
import {
  respuestaCinesButacaSchema,
  respuestaPeliculasButacaSchema,
  respuestaFuncionesButacaSchema,
} from '../models/funcionCine.model.js';
import { fetchJson } from '../utils/fetchJson.js';
import { createTtlCache } from '../utils/ttlCache.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

// Adaptación de la superficie anónima de Butaca, MIT; ver docs/licenses/butaca.txt.
const BASE_URL = FUNCIONES_CINE_CONFIG.BUTACA_BASE_URL;
const cache = createTtlCache({
  ttlMs: FUNCIONES_CINE_CONFIG.BUTACA_TTL_MS,
  maxEntries: FUNCIONES_CINE_CONFIG.CACHE_MAX_ENTRIES,
});
const cinesCache = createTtlCache({ ttlMs: FUNCIONES_CINE_CONFIG.BUTACA_TTL_MS, maxEntries: 1 });

export function estaHabilitadoButaca() {
  return env.BUTACA_ENABLED === 'true' && BUTACA_VERIFICADO;
}

async function consultarButaca(path, params, schema) {
  if (!estaHabilitadoButaca())
    throw new ExternalServiceError('Butaca: complemento no habilitado o sin verificación');
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const data = validateExternalResponse(
    schema,
    await fetchJson(url, {
      service: 'Butaca / Cinemark',
      headers: { country: 'AR' },
      timeoutMs: FUNCIONES_CINE_CONFIG.TIMEOUT_MS,
    }),
    'Butaca / Cinemark',
  ).data;
  return { data, consultadoEn: new Date().toISOString() };
}

export function listarCinesButaca() {
  return cinesCache.getOrSet('cinemark-ar', () =>
    consultarButaca('/cinema/theaters', { limit: '100' }, respuestaCinesButacaSchema),
  );
}

export function listarPeliculasButaca(cineId) {
  return cache.getOrSet(`peliculas:${cineId}`, () =>
    consultarButaca('/cinema/movies', { theater: String(cineId) }, respuestaPeliculasButacaSchema),
  );
}
export function listarFuncionesButaca({ corporateId, cineId }) {
  return cache.getOrSet(`funciones:${cineId}:${corporateId}`, () =>
    consultarButaca(
      '/cinema/showtimes',
      { movieCorporateId: corporateId, theater: String(cineId) },
      respuestaFuncionesButacaSchema,
    ),
  );
}
