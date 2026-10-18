import { TIPO_TITULO } from '@buscador/shared/constants';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const RUTA_TMDB_POR_TIPO = Object.freeze({
  [TIPO_TITULO.PELICULA]: 'movie',
  [TIPO_TITULO.SERIE]: 'tv',
});

export const TMDB_CONFIG = Object.freeze({
  MAX_CONCURRENT_REQUESTS: 8,
  CACHE_TTL_MS: 24 * ONE_HOUR_MS,
  CACHE_MAX_ENTRIES: 5000,
});
