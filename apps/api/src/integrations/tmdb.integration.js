import { env } from '../config/env.config.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';
import { TIPO_TITULO, TMDB_LOGO_BASE_URL } from '@buscador/shared/constants';

const BASE_URL = 'https://api.themoviedb.org/3';
const TIMEOUT_MS = 8000;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

async function tmdbRequest(path, params = {}) {
  if (!env.TMDB_API_KEY) {
    throw new ExternalServiceError('TMDB', new Error('Falta configurar TMDB_API_KEY'));
  }

  const url = new URL(BASE_URL + path);
  url.searchParams.set('api_key', env.TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ExternalServiceError('TMDB', error);
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError('No se encontró el título solicitado');
    }

    throw new ExternalServiceError('TMDB', new Error(`HTTP ${response.status} en ${path}`));
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ExternalServiceError('TMDB', error);
  }
}

function searchParams({ q, pagina }) {
  return {
    query: q,
    language: 'es-AR',
    include_adult: false,
    page: pagina,
  };
}

function obtenerAnio(fecha) {
  const anio = typeof fecha === 'string' ? fecha.slice(0, 4) : null;
  return /^\d{4}$/.test(anio ?? '') ? Number(anio) : null;
}

function obtenerTexto(valor) {
  return typeof valor === 'string' && valor.trim() ? valor : null;
}

function normalizarDetalle(item, tipo) {
  const fecha = tipo === TIPO_TITULO.PELICULA ? item?.release_date : item?.first_air_date;

  return {
    tmdbId: item?.id,
    tipo,
    nombre: obtenerTexto(item?.title) ?? obtenerTexto(item?.name),
    sinopsis: obtenerTexto(item?.overview),
    posterUrl: item?.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
    anio: obtenerAnio(fecha),
    puntuacion: Number.isFinite(item?.vote_average) ? Number(item.vote_average) : null,
  };
}

function normalizarResultado(item, tipo) {
  const fecha = tipo === TIPO_TITULO.PELICULA ? item?.release_date : item?.first_air_date;

  return {
    tmdbId: item?.id,
    tipo,
    nombre: item?.title ?? item?.name ?? 'Sin título',
    anio: obtenerAnio(fecha),
    posterUrl: item?.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
    puntuacion: Number.isFinite(item?.vote_average) ? Number(item.vote_average) : null,
    relevancia: Number.isFinite(item?.popularity) ? item.popularity : 0,
  };
}

function normalizarRespuesta(response, tipo) {
  const items = response?.results;

  return {
    resultados: Array.isArray(items) ? items.map((item) => normalizarResultado(item, tipo)) : items,
    pagina: response?.page,
    totalResultados: response?.total_results,
    totalPaginas: response?.total_pages,
  };
}

export async function buscarPeliculas({ q, anio, pagina }) {
  const response = await tmdbRequest('/search/movie', {
    ...searchParams({ q, pagina }),
    ...(anio === undefined ? {} : { primary_release_year: anio }),
  });

  return normalizarRespuesta(response, TIPO_TITULO.PELICULA);
}

export async function buscarSeries({ q, anio, pagina }) {
  const response = await tmdbRequest('/search/tv', {
    ...searchParams({ q, pagina }),
    ...(anio === undefined ? {} : { first_air_date_year: anio }),
  });

  return normalizarRespuesta(response, TIPO_TITULO.SERIE);
}

export async function obtenerPelicula(tmdbId) {
  const response = await tmdbRequest(`/movie/${tmdbId}`, { language: 'es-AR' });
  return normalizarDetalle(response, TIPO_TITULO.PELICULA);
}

export async function obtenerSerie(tmdbId) {
  const response = await tmdbRequest(`/tv/${tmdbId}`, { language: 'es-AR' });
  return normalizarDetalle(response, TIPO_TITULO.SERIE);
}

export const obtenerDetallePelicula = obtenerPelicula;
export const obtenerDetalleSerie = obtenerSerie;

const TIPOS_OFERTA_TMDB = {
  flatrate: 'suscripcion',
  free: 'gratis',
  ads: 'con_anuncios',
  rent: 'alquiler',
  buy: 'compra',
};

function obtenerEnlaceTmdb(link) {
  if (typeof link !== 'string') {
    return null;
  }
  try {
    const url = new URL(link);
    return url.protocol === 'https:' && url.hostname === 'www.themoviedb.org' ? url.href : null;
  } catch {
    return null;
  }
}

export async function obtenerDisponibilidad({ tipo, tmdbId, region }) {
  const recurso = tipo === TIPO_TITULO.PELICULA ? 'movie' : 'tv';
  const response = await tmdbRequest(`/${recurso}/${tmdbId}/watch/providers`);
  if (!response?.results || typeof response.results !== 'object') {
    throw new ExternalServiceError('TMDB', new Error('Respuesta de disponibilidad inválida'));
  }

  const datosRegion = response.results[region];
  if (!datosRegion) {
    return { region, ofertas: [], enlaceTmdb: null };
  }

  return {
    region,
    ofertas: Object.entries(TIPOS_OFERTA_TMDB).flatMap(([tipoTmdb, tipoOferta]) => {
      const plataformas = datosRegion[tipoTmdb];
      if (plataformas === undefined) {
        return [];
      }
      return [
        {
          tipoOferta,
          plataformas: Array.isArray(plataformas)
            ? plataformas.map((plataforma) => ({
                tmdbProviderId: plataforma?.provider_id,
                nombre: plataforma?.provider_name,
                logoUrl: plataforma?.logo_path
                  ? `${TMDB_LOGO_BASE_URL}${plataforma.logo_path}`
                  : null,
              }))
            : plataformas,
        },
      ];
    }),
    enlaceTmdb: obtenerEnlaceTmdb(datosRegion.link),
  };
}
