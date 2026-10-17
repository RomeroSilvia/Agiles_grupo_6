import { env } from '../config/env.config.js';
import { TMDB_CONFIG } from '../config/tmdb.config.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';
import { createConcurrencyLimiter } from '../utils/concurrencyLimiter.js';
import { createTtlCache } from '../utils/ttlCache.js';
import { TIPO_OFERTA, TIPO_TITULO } from '@buscador/shared/constants';

const BASE_URL = 'https://api.themoviedb.org/3';
const TIMEOUT_MS = 8000;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';
const TMDB_LANGUAGE = 'es-AR';

const RUTA_TMDB_POR_TIPO = Object.freeze({
  [TIPO_TITULO.PELICULA]: 'movie',
  [TIPO_TITULO.SERIE]: 'tv',
});

const PARAMETRO_ANIO_POR_TIPO = Object.freeze({
  [TIPO_TITULO.PELICULA]: 'primary_release_year',
  [TIPO_TITULO.SERIE]: 'first_air_date_year',
});

const CAMPO_FECHA_POR_TIPO = Object.freeze({
  [TIPO_TITULO.PELICULA]: 'release_date',
  [TIPO_TITULO.SERIE]: 'first_air_date',
});

const TIPO_OFERTA_POR_CLAVE_TMDB = Object.freeze({
  flatrate: TIPO_OFERTA.SUSCRIPCION,
  free: TIPO_OFERTA.GRATIS,
  ads: TIPO_OFERTA.CON_ANUNCIOS,
  rent: TIPO_OFERTA.ALQUILER,
  buy: TIPO_OFERTA.COMPRA,
});

const limitarConcurrencia = createConcurrencyLimiter(TMDB_CONFIG.MAX_CONCURRENT_REQUESTS);

const busquedasCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES,
});
const ofertasCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES,
});
const creditosCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES,
});
const generosCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES_GENEROS,
});
const personasCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES_PERSONAS,
});
const creditosCombinadosCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES_ROLES_PERSONA,
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
    const cause = new Error(`HTTP ${response.status} en ${path}`);
    cause.status = response.status;
    throw new ExternalServiceError('TMDB', cause);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ExternalServiceError('TMDB', error);
  }
}

function mapearColeccion(items, mapear) {
  return Array.isArray(items) ? items.map(mapear) : items;
}

function obtenerAnio(fecha) {
  const anio = typeof fecha === 'string' ? fecha.slice(0, 4) : null;
  return /^\d{4}$/.test(anio ?? '') ? Number(anio) : null;
}

function obtenerTexto(valor) {
  return typeof valor === 'string' && valor.trim() ? valor : null;
}

function normalizarBase(item, tipo) {
  const fecha = item?.[CAMPO_FECHA_POR_TIPO[tipo]];

  return {
    tmdbId: item?.id,
    tipo,
    nombre: obtenerTexto(item?.title) ?? obtenerTexto(item?.name),
    posterUrl: item?.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
    anio: obtenerAnio(fecha),
    puntuacion: Number.isFinite(item?.vote_average) ? Number(item.vote_average) : null,
  };
}

function normalizarResultado(item, tipo) {
  return {
    ...normalizarBase(item, tipo),
    relevancia: Number.isFinite(item?.popularity) ? item.popularity : 0,
    generoIds: item?.genre_ids,
    fecha: item?.[CAMPO_FECHA_POR_TIPO[tipo]] ?? null,
  };
}

function normalizarRespuestaBusqueda(response, tipo) {
  return {
    resultados: mapearColeccion(response?.results, (item) => normalizarResultado(item, tipo)),
    pagina: response?.page,
    totalResultados: response?.total_results,
    totalPaginas: response?.total_pages,
  };
}

function normalizarPersona(persona) {
  return {
    id: persona?.id,
    nombre: persona?.name,
    fotoUrl: persona?.profile_path ? `${PROFILE_BASE_URL}${persona.profile_path}` : null,
    departamentoConocido: persona?.known_for_department ?? null,
  };
}

function normalizarCredito(credito, tipo) {
  return {
    ...normalizarResultado(credito, tipo),
    puesto: credito?.job,
  };
}

function parametrosBusqueda({ q, pagina }) {
  return {
    query: q,
    language: TMDB_LANGUAGE,
    include_adult: false,
    page: pagina,
  };
}

export function buscarTitulosPorTexto({ tipo, q, anio, pagina }) {
  const ruta = RUTA_TMDB_POR_TIPO[tipo];
  const parametros = parametrosBusqueda({ q, pagina });
  if (anio !== undefined) {
    parametros[PARAMETRO_ANIO_POR_TIPO[tipo]] = anio;
  }

  return busquedasCache.getOrSet(`texto:${tipo}:${q}:${anio ?? ''}:${pagina}`, async () => {
    const respuesta = await tmdbRequest(`/search/${ruta}`, parametros);
    return normalizarRespuestaBusqueda(respuesta, tipo);
  });
}

export function descubrirTitulos({ tipo, anio, generoIds, pagina }) {
  const ruta = RUTA_TMDB_POR_TIPO[tipo];
  const parametros = {
    language: TMDB_LANGUAGE,
    include_adult: false,
    page: pagina,
    ...(anio === undefined ? {} : { [PARAMETRO_ANIO_POR_TIPO[tipo]]: anio }),
    ...(generoIds === undefined ? {} : { with_genres: generoIds.join('|') }),
  };

  return busquedasCache.getOrSet(
    `discover:${tipo}:${anio ?? ''}:${generoIds?.join('|') ?? ''}:${pagina}`,
    async () =>
      normalizarRespuestaBusqueda(await tmdbRequest(`/discover/${ruta}`, parametros), tipo),
  );
}

export function obtenerCreditosPersona({ personaId, tipo }) {
  return creditosCache.getOrSet(`${personaId}:${tipo}`, async () => {
    const ruta = RUTA_TMDB_POR_TIPO[tipo];
    const respuesta = await tmdbRequest(`/person/${personaId}/${ruta}_credits`, {
      language: TMDB_LANGUAGE,
    });
    return {
      cast: mapearColeccion(respuesta?.cast, (credito) => normalizarCredito(credito, tipo)),
      crew: mapearColeccion(respuesta?.crew, (credito) => normalizarCredito(credito, tipo)),
    };
  });
}

export function obtenerCreditosCombinados({ personaId }) {
  return creditosCombinadosCache.getOrSet(String(personaId), async () => {
    const respuesta = await tmdbRequest(`/person/${personaId}/combined_credits`, {
      language: TMDB_LANGUAGE,
    });
    return {
      cast: mapearColeccion(respuesta?.cast, (credito) => ({ id: credito?.id })),
      crew: mapearColeccion(respuesta?.crew, (credito) => ({
        id: credito?.id,
        job: credito?.job,
      })),
    };
  });
}

export function buscarPersonas({ q, pagina }) {
  const consulta = q.trim();
  return personasCache.getOrSet(
    `buscar:${consulta.toLocaleLowerCase('es')}:${pagina}`,
    async () => {
      const respuesta = await tmdbRequest('/search/person', {
        query: consulta,
        language: TMDB_LANGUAGE,
        include_adult: false,
        page: pagina,
      });
      return {
        resultados: mapearColeccion(respuesta?.results, normalizarPersona),
        totalPaginas: respuesta?.total_pages,
      };
    },
  );
}

export function obtenerPersona({ personaId }) {
  return personasCache.getOrSet(`id:${personaId}`, async () => {
    const respuesta = await tmdbRequest(`/person/${personaId}`, { language: TMDB_LANGUAGE });
    return normalizarPersona(respuesta);
  });
}

export function listarGenerosPorTipo(tipo) {
  const ruta = RUTA_TMDB_POR_TIPO[tipo];
  return generosCache.getOrSet(tipo, async () => {
    const respuesta = await tmdbRequest(`/genre/${ruta}/list`, { language: TMDB_LANGUAGE });
    return mapearColeccion(respuesta?.genres, (genero) => ({
      id: genero?.id,
      nombre: genero?.name,
    }));
  });
}

export async function obtenerDetalle(tipo, tmdbId) {
  const ruta = RUTA_TMDB_POR_TIPO[tipo];
  if (!ruta) {
    throw new TypeError(`Tipo de título inválido: ${tipo}`);
  }

  let response;
  try {
    response = await tmdbRequest(`/${ruta}/${tmdbId}`, {
      language: TMDB_LANGUAGE,
    });
  } catch (error) {
    if (error instanceof ExternalServiceError && error.cause?.status === 404) {
      throw new NotFoundError('No se encontró el título solicitado');
    }
    throw error;
  }

  return {
    ...normalizarBase(response, tipo),
    sinopsis: obtenerTexto(response?.overview),
  };
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
    if (error instanceof ExternalServiceError && error.cause?.status === 404) {
      return {};
    }
    throw error;
  }
}

export function obtenerOfertas({ tipo, tmdbId }) {
  return ofertasCache.getOrSet(`${tipo}:${tmdbId}`, () => consultarOfertas(tipo, tmdbId));
}
