import { env } from '../config/env.config.js';
import { ExternalServiceError } from '../errors/index.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const TIMEOUT_MS = 8000;

async function tmdbRequest(path, params = {}) {
  if (!env.TMDB_API_TOKEN) {
    throw new ExternalServiceError('TMDB', new Error('Falta configurar TMDB_API_TOKEN'));
  }

  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.TMDB_API_TOKEN}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ExternalServiceError('TMDB', error);
  }

  if (!response.ok) {
    throw new ExternalServiceError('TMDB', new Error(`HTTP ${response.status} en ${path}`));
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ExternalServiceError('TMDB', error);
  }
}

function searchParams({ q, anio, pagina }) {
  return {
    query: q,
    language: 'es-AR',
    include_adult: false,
    page: pagina,
    ...(anio === undefined ? {} : { year: anio }),
  };
}

export function buscarPeliculas({ q, anio, pagina }) {
  return tmdbRequest('/search/movie', {
    ...searchParams({ q, anio, pagina }),
    ...(anio === undefined ? {} : { primary_release_year: anio }),
  });
}

export function buscarSeries({ q, anio, pagina }) {
  return tmdbRequest('/search/tv', {
    ...searchParams({ q, anio, pagina }),
    ...(anio === undefined ? {} : { first_air_date_year: anio }),
  });
}
