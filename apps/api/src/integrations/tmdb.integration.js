import { env } from '../config/env.config.js';
import { TMDB_CONFIG } from '../config/tmdb.config.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';
import { createConcurrencyLimiter } from '../utils/concurrencyLimiter.js';
import { createTtlCache } from '../utils/ttlCache.js';
import { TIPO_OFERTA, TIPO_TITULO } from '@buscador/shared/constants';

const BASE_URL = 'https://api.themoviedb.org/3';
const TIMEOUT_MS = 8000;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const RUTA_TMDB_POR_TIPO = Object.freeze({
  [TIPO_TITULO.PELICULA]: 'movie',
  [TIPO_TITULO.SERIE]: 'tv',
});

const TIPO_OFERTA_POR_CLAVE_TMDB = Object.freeze({
  flatrate: TIPO_OFERTA.SUSCRIPCION,
  free: TIPO_OFERTA.GRATIS,
  ads: TIPO_OFERTA.CON_ANUNCIOS,
  rent: TIPO_OFERTA.ALQUILER,
  buy: TIPO_OFERTA.COMPRA,
});

const limitarConcurrencia = createConcurrencyLimiter(TMDB_CONFIG.MAX_CONCURRENT_REQUESTS);

const ofertasCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES,
});

function tmdbRequest(path, params) {
  return limitarConcurrencia(() => tmdbFetch(path, params));
}

async function tmdbFetch(path, params = {}) {
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

async function obtenerDetalle(tipo, tmdbId) {
  const response = await tmdbRequest(`/${RUTA_TMDB_POR_TIPO[tipo]}/${tmdbId}`, {
    language: 'es-AR',
  });
  return normalizarDetalle(response, tipo);
}

export function obtenerPelicula(tmdbId) {
  return obtenerDetalle(TIPO_TITULO.PELICULA, tmdbId);
}

export function obtenerSerie(tmdbId) {
  return obtenerDetalle(TIPO_TITULO.SERIE, tmdbId);
}

function normalizarOfertasDeRegion(datosRegion) {
  return Object.entries(TIPO_OFERTA_POR_CLAVE_TMDB).flatMap(([clave, tipoOferta]) => {
    const proveedores = Array.isArray(datosRegion?.[clave]) ? datosRegion[clave] : [];
    return proveedores
      .filter((proveedor) => Number.isInteger(proveedor?.provider_id))
      .map((proveedor) => ({
        tmdbProviderId: proveedor.provider_id,
        tipoOferta,
        logoPath: proveedor.logo_path ?? null,
      }));
  });
}

function normalizarEnlaceTmdb(enlace) {
  if (typeof enlace !== 'string') {
    return null;
  }

  try {
    const url = new URL(enlace);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizarOfertas(response) {
  const regiones = response?.results;
  if (!regiones || typeof regiones !== 'object' || Array.isArray(regiones)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(regiones).map(([region, datosRegion]) => [
      region,
      {
        enlaceTmdb: normalizarEnlaceTmdb(datosRegion?.link),
        ofertas: normalizarOfertasDeRegion(datosRegion),
      },
    ]),
  );
}

async function consultarOfertas(tipo, tmdbId) {
  try {
    const response = await tmdbRequest(`/${RUTA_TMDB_POR_TIPO[tipo]}/${tmdbId}/watch/providers`);
    return normalizarOfertas(response);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {};
    }
    throw error;
  }
}

export function obtenerOfertas({ tipo, tmdbId }) {
  return ofertasCache.getOrSet(`${tipo}:${tmdbId}`, () => consultarOfertas(tipo, tmdbId));
}
