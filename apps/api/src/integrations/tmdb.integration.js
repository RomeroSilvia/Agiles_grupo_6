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
const MAX_PERSONAS_SUGERIDAS = 8;
const MAX_PAGINAS_BUSQUEDA_PERSONAS = 5;
const MAX_PERSONAS_SECUNDARIAS_A_VALIDAR = 8;
const TAMANIO_LOTE_CREDITOS_PERSONAS = 4;

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

const creditosCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES,
});

const generosCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: 2,
});

const personasCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: 500,
});

const rolesPersonaCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: 1000,
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

function searchParams({ q, pagina }) {
  return {
    query: q,
    language: TMDB_LANGUAGE,
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

function normalizarBase(item, tipo) {
  const fecha = tipo === TIPO_TITULO.PELICULA ? item?.release_date : item?.first_air_date;

  return {
    tmdbId: item?.id,
    tipo,
    nombre: obtenerTexto(item?.title) ?? obtenerTexto(item?.name),
    posterUrl: item?.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
    anio: obtenerAnio(fecha),
    puntuacion: Number.isFinite(item?.vote_average) ? Number(item.vote_average) : null,
  };
}

function normalizarDetalle(item, tipo) {
  return {
    ...normalizarBase(item, tipo),
    sinopsis: obtenerTexto(item?.overview),
  };
}

function normalizarResultado(item, tipo) {
  return {
    ...normalizarBase(item, tipo),
    relevancia: Number.isFinite(item?.popularity) ? item.popularity : 0,
  };
}

function respuestaInvalida(mensaje) {
  return new ExternalServiceError('TMDB', new Error(mensaje));
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

async function obtenerIdsCreditos({ personaId, rol, tipo }) {
  return creditosCache.getOrSet(`${personaId}:${rol}:${tipo}`, async () => {
    const ruta = RUTA_TMDB_POR_TIPO[tipo];
    const respuesta = await tmdbRequest(`/person/${personaId}/${ruta}_credits`, {
      language: TMDB_LANGUAGE,
    });
    const tipoCredito = rol === 'actor' ? 'cast' : 'crew';
    const creditos = respuesta?.[tipoCredito];

    if (!Array.isArray(creditos)) {
      throw respuestaInvalida('TMDB devolvió créditos inválidos');
    }

    return new Set(
      creditos
        .filter((credito) =>
          rol === 'actor'
            ? true
            : typeof credito?.job === 'string' &&
              credito.job.toLocaleLowerCase('en') === 'director',
        )
        .map((credito) => credito?.id)
        .filter((id) => Number.isInteger(id) && id > 0),
    );
  });
}

async function personaTieneCreditoDeRol({ personaId, rol }) {
  return rolesPersonaCache.getOrSet(`${personaId}:${rol}`, async () => {
    const respuesta = await tmdbRequest(`/person/${personaId}/combined_credits`, {
      language: TMDB_LANGUAGE,
    });
    const creditos = rol === 'actor' ? respuesta?.cast : respuesta?.crew;

    if (!Array.isArray(creditos)) {
      throw respuestaInvalida('TMDB devolvió créditos combinados inválidos');
    }

    return creditos.some(
      (credito) =>
        Number.isInteger(credito?.id) &&
        credito.id > 0 &&
        (rol === 'actor' ||
          (typeof credito?.job === 'string' && credito.job.toLocaleLowerCase('en') === 'director')),
    );
  });
}

async function normalizarRespuestaFiltrada(response, tipo, filtros) {
  const items = response?.results;
  if (!Array.isArray(items)) {
    return normalizarRespuesta(response, tipo);
  }

  const personas = [
    ...(filtros.actor === undefined ? [] : [{ personaId: filtros.actor, rol: 'actor' }]),
    ...(filtros.director === undefined ? [] : [{ personaId: filtros.director, rol: 'director' }]),
  ];
  const creditos = await Promise.all(
    personas.map(({ personaId, rol }) => obtenerIdsCreditos({ personaId, rol, tipo })),
  );

  const resultados = items.filter((item) => {
    if (filtros.genero !== undefined) {
      if (!Array.isArray(item?.genre_ids)) {
        throw respuestaInvalida('TMDB devolvió géneros inválidos para un título');
      }
      if (!item.genre_ids.includes(filtros.genero)) {
        return false;
      }
    }

    if (creditos.some((ids) => !ids.has(item?.id))) {
      return false;
    }

    return true;
  });

  return normalizarRespuesta({ ...response, results: resultados }, tipo);
}

export async function buscarPeliculas({ q, anio, pagina, genero, actor, director }) {
  const response = await tmdbRequest('/search/movie', {
    ...searchParams({ q, pagina }),
    ...(anio === undefined ? {} : { primary_release_year: anio }),
  });

  return normalizarRespuestaFiltrada(response, TIPO_TITULO.PELICULA, { genero, actor, director });
}

export async function buscarSeries({ q, anio, pagina, genero, actor, director }) {
  const response = await tmdbRequest('/search/tv', {
    ...searchParams({ q, pagina }),
    ...(anio === undefined ? {} : { first_air_date_year: anio }),
  });

  return normalizarRespuestaFiltrada(response, TIPO_TITULO.SERIE, {
    genero,
    actor,
    director,
  });
}

async function consultarGeneros(ruta) {
  const respuesta = await tmdbRequest(`/genre/${ruta}/list`, { language: TMDB_LANGUAGE });
  if (!Array.isArray(respuesta?.genres)) {
    throw respuestaInvalida('TMDB devolvió una lista de géneros inválida');
  }

  return respuesta.genres.map((genero) => {
    if (!Number.isInteger(genero?.id) || genero.id < 1 || typeof genero.name !== 'string') {
      throw respuestaInvalida('TMDB devolvió un género inválido');
    }
    return { id: genero.id, nombre: genero.name };
  });
}

async function cargarGeneros() {
  const [generosPelicula, generosSerie] = await Promise.all([
    consultarGeneros('movie'),
    consultarGeneros('tv'),
  ]);
  const porId = new Map();

  for (const genero of [...generosPelicula, ...generosSerie]) {
    porId.set(genero.id, genero);
  }

  return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function listarGeneros() {
  return generosCache.getOrSet('generos', cargarGeneros);
}

export function buscarPersonas({ q, rol }) {
  const consulta = q.trim();
  const clave = `${rol}:${consulta.toLocaleLowerCase('es')}`;

  return personasCache.getOrSet(clave, async () => {
    const departamento = rol === 'actor' ? 'acting' : 'directing';
    const personas = [];
    const idsIncluidos = new Set();
    let personasSecundariasValidadas = 0;
    let totalPaginas = 1;

    for (
      let pagina = 1;
      pagina <= Math.min(totalPaginas, MAX_PAGINAS_BUSQUEDA_PERSONAS) &&
      personas.length < MAX_PERSONAS_SUGERIDAS;
      pagina += 1
    ) {
      const respuesta = await tmdbRequest('/search/person', {
        ...searchParams({ q: consulta, pagina }),
      });
      if (!Array.isArray(respuesta?.results)) {
        throw respuestaInvalida('TMDB devolvió una lista de personas inválida');
      }
      totalPaginas = Number.isInteger(respuesta.total_pages) ? respuesta.total_pages : pagina;

      const candidatas = respuesta.results.filter(
        (persona) =>
          Number.isInteger(persona?.id) && persona.id > 0 && typeof persona.name === 'string',
      );
      const candidatasPrincipales = candidatas.filter(
        (persona) =>
          typeof persona.known_for_department === 'string' &&
          persona.known_for_department.toLocaleLowerCase('en') === departamento,
      );
      const idsPrincipalesNuevos = new Set(
        candidatasPrincipales.map((persona) => persona.id).filter((id) => !idsIncluidos.has(id)),
      );
      const candidatasSecundarias = candidatas.filter(
        (persona) => !candidatasPrincipales.includes(persona) && !idsIncluidos.has(persona.id),
      );
      const cuposRestantes = Math.max(
        0,
        MAX_PERSONAS_SUGERIDAS - personas.length - idsPrincipalesNuevos.size,
      );
      const cantidadAValidar = Math.min(
        cuposRestantes === 0 ? 0 : candidatasSecundarias.length,
        MAX_PERSONAS_SECUNDARIAS_A_VALIDAR - personasSecundariasValidadas,
      );
      const validadasSecundarias = new Set();

      for (let inicio = 0; inicio < cantidadAValidar; inicio += TAMANIO_LOTE_CREDITOS_PERSONAS) {
        const lote = candidatasSecundarias.slice(
          inicio,
          Math.min(inicio + TAMANIO_LOTE_CREDITOS_PERSONAS, cantidadAValidar),
        );
        const elegibles = await Promise.all(
          lote.map((persona) =>
            personaTieneCreditoDeRol({ personaId: persona.id, rol }).then((tieneRol) =>
              tieneRol ? persona.id : null,
            ),
          ),
        );
        elegibles.filter((id) => id !== null).forEach((id) => validadasSecundarias.add(id));
        personasSecundariasValidadas += lote.length;

        if (validadasSecundarias.size >= cuposRestantes) {
          break;
        }
      }

      for (const persona of candidatas) {
        const esDelRolBuscado =
          candidatasPrincipales.includes(persona) || validadasSecundarias.has(persona.id);
        if (
          !esDelRolBuscado ||
          !Number.isInteger(persona?.id) ||
          persona.id < 1 ||
          typeof persona.name !== 'string' ||
          idsIncluidos.has(persona.id)
        ) {
          continue;
        }

        idsIncluidos.add(persona.id);
        personas.push({
          id: persona.id,
          nombre: persona.name,
          fotoUrl: persona.profile_path ? `${PROFILE_BASE_URL}${persona.profile_path}` : null,
        });

        if (personas.length >= MAX_PERSONAS_SUGERIDAS) {
          break;
        }
      }
    }

    return personas;
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

  return normalizarDetalle(response, tipo);
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
