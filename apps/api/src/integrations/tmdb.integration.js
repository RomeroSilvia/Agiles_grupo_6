import { env } from '../config/env.config.js';
import { identidadPeliculaTmdbCineSchema } from '../models/funcionCine.model.js';
import {
  CARTELERA_CONFIG,
  RUTA_TMDB_POR_TIPO,
  TIPOS_ESTRENO_SALA_TMDB,
  TMDB_CONFIG,
} from '../config/tmdb.config.js';
import { ExternalServiceError, NotFoundError } from '../errors/index.js';
import {
  crearRespuestaDetallePeliculaSchema,
  respuestaIdsCarteleraSchema,
  respuestaTmdbCarteleraSchema,
  respuestaVentanaEstrenosSchema,
} from '../models/cartelera.model.js';
import { createConcurrencyLimiter } from '../utils/concurrencyLimiter.js';
import { parseYear } from '../utils/date.js';
import { fetchJson } from '../utils/fetchJson.js';
import { createTtlCache } from '../utils/ttlCache.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';
import { REGION_CARTELERA, TIPO_OFERTA, TIPO_TITULO } from '@buscador/shared/constants';
import { httpUrlSchema } from '@buscador/shared/schemas';

const { BASE_URL, TIMEOUT_MS, POSTER_BASE_URL, PROFILE_BASE_URL } = TMDB_CONFIG;
const TMDB_LANGUAGE = TMDB_CONFIG.LANGUAGE;

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
const cartelerasCache = createTtlCache({
  ttlMs: CARTELERA_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES,
});
const fechasEstrenoCache = createTtlCache({
  ttlMs: TMDB_CONFIG.CACHE_TTL_MS,
  maxEntries: TMDB_CONFIG.CACHE_MAX_ENTRIES,
});

function esNoEncontrado(error) {
  return error instanceof ExternalServiceError && error.cause?.status === 404;
}

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

  return fetchJson(url, { service: 'TMDB', timeoutMs: TIMEOUT_MS });
}

function mapearColeccion(items, mapear) {
  return Array.isArray(items) ? items.map(mapear) : items;
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
    posterUrl: item?.poster_path ? `${POSTER_BASE_URL}${item.poster_path}` : null,
    anio: parseYear(fecha),
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

export function descubrirTitulos({
  tipo,
  anio,
  generoIds,
  generosExcluidos,
  puntuacionMinima,
  votosMinimos,
  pagina,
}) {
  const ruta = RUTA_TMDB_POR_TIPO[tipo];
  const parametros = {
    language: TMDB_LANGUAGE,
    include_adult: false,
    page: pagina,
    ...(anio === undefined ? {} : { [PARAMETRO_ANIO_POR_TIPO[tipo]]: anio }),
    // En TMDB, `|` combina los géneros como «alguno de» y `,` como «todos».
    ...(generoIds === undefined ? {} : { with_genres: generoIds.join('|') }),
    ...(generosExcluidos?.length ? { without_genres: generosExcluidos.join(',') } : {}),
    'vote_average.gte': puntuacionMinima,
    'vote_count.gte': votosMinimos,
  };
  const clave = [
    tipo,
    anio ?? '',
    generoIds?.join('|') ?? '',
    generosExcluidos?.join(',') ?? '',
    puntuacionMinima ?? '',
    votosMinimos ?? '',
    pagina,
  ].join(':');

  return busquedasCache.getOrSet(`discover:${clave}`, async () =>
    normalizarRespuestaBusqueda(await tmdbRequest(`/discover/${ruta}`, parametros), tipo),
  );
}

function obtenerAnioOriginalPelicula(tmdbId) {
  return obtenerFechasEstrenoArgentina({ tmdbId }).then(({ anio }) => anio);
}

export function listarPeliculasEnCartelera({ pagina }) {
  return cartelerasCache.getOrSet(`${REGION_CARTELERA}:${pagina}`, async () => {
    const respuesta = await tmdbRequest('/movie/now_playing', {
      region: REGION_CARTELERA,
      language: TMDB_LANGUAGE,
      page: pagina,
    });

    const cartelera = validateExternalResponse(respuestaTmdbCarteleraSchema, {
      resultados: mapearColeccion(respuesta?.results, (item) =>
        normalizarBase(item, TIPO_TITULO.PELICULA),
      ),
      pagina: respuesta?.page,
      totalResultados: respuesta?.total_results,
      totalPaginas: respuesta?.total_pages,
      consultadoEn: new Date().toISOString(),
    });

    return {
      ...cartelera,
      resultados: await Promise.all(
        cartelera.resultados.map(async (pelicula) => ({
          ...pelicula,
          anio: await obtenerAnioOriginalPelicula(pelicula.tmdbId),
        })),
      ),
    };
  });
}

export function obtenerFechaEstrenoArgentina({ tmdbId }) {
  return obtenerFechasEstrenoArgentina({ tmdbId }).then(({ fechas, consultadoEn }) => ({
    fechaEstrenoAr: fechas[0] ?? null,
    consultadoEn,
  }));
}

export function obtenerFechasEstrenoArgentina({ tmdbId }) {
  return fechasEstrenoCache.getOrSet(String(tmdbId), async () => {
    let detalle;
    try {
      detalle = validateExternalResponse(
        crearRespuestaDetallePeliculaSchema(tmdbId),
        await tmdbRequest(`/movie/${tmdbId}`, { append_to_response: 'release_dates' }),
      );
    } catch (error) {
      if (esNoEncontrado(error)) {
        return { anio: null, fechas: [], consultadoEn: new Date().toISOString() };
      }
      throw error;
    }
    const respuesta = detalle.release_dates;
    const fechasArgentina = respuesta.results
      .filter(({ iso_3166_1 }) => iso_3166_1 === REGION_CARTELERA)
      .flatMap(({ release_dates }) => release_dates)
      .filter(({ type }) => TIPOS_ESTRENO_SALA_TMDB.includes(type));

    return {
      anio: parseYear(detalle.release_date),
      fechas: [...new Set(fechasArgentina.map(({ release_date }) => release_date))].sort(),
      consultadoEn: new Date().toISOString(),
    };
  });
}

export async function listarCandidatosEstrenos({ origen, desde, hasta, pagina }) {
  const respuesta = await tmdbRequest(
    origen === 'upcoming' ? '/movie/upcoming' : '/discover/movie',
    {
      region: REGION_CARTELERA,
      language: TMDB_LANGUAGE,
      page: pagina,
      ...(origen === 'upcoming'
        ? {}
        : {
            with_release_type: TIPOS_ESTRENO_SALA_TMDB.join('|'),
            include_adult: false,
            include_video: false,
            'release_date.gte': desde,
            'release_date.lte': hasta,
          }),
    },
  );
  const datos = validateExternalResponse(respuestaTmdbCarteleraSchema, {
    resultados: mapearColeccion(respuesta?.results, (item) =>
      normalizarBase(item, TIPO_TITULO.PELICULA),
    ),
    pagina: respuesta?.page,
    totalResultados: respuesta?.total_results,
    totalPaginas: respuesta?.total_pages,
    consultadoEn: new Date().toISOString(),
  });
  const esperados = Math.min(
    TMDB_CONFIG.RESULTADOS_POR_PAGINA,
    Math.max(0, datos.totalResultados - (pagina - 1) * TMDB_CONFIG.RESULTADOS_POR_PAGINA),
  );
  if (datos.pagina !== pagina || datos.resultados.length !== esperados) {
    throw new ExternalServiceError(
      'TMDB',
      new Error('La página de candidatos no se recibió completa'),
    );
  }
  if (origen === 'upcoming') {
    validateExternalResponse(respuestaVentanaEstrenosSchema, respuesta?.dates);
  }
  return datos;
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
    try {
      const respuesta = await tmdbRequest(`/person/${personaId}`, { language: TMDB_LANGUAGE });
      return normalizarPersona(respuesta);
    } catch (error) {
      if (esNoEncontrado(error)) {
        throw new NotFoundError('No se encontró la persona solicitada');
      }
      throw error;
    }
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

export async function obtenerDetalle(tipo, tmdbId, { incluirIdentidadCine = false } = {}) {
  const ruta = RUTA_TMDB_POR_TIPO[tipo];
  if (!ruta) {
    throw new TypeError(`Tipo de título inválido: ${tipo}`);
  }

  let response;
  try {
    response = await tmdbRequest(`/${ruta}/${tmdbId}`, {
      language: TMDB_LANGUAGE,
      ...(incluirIdentidadCine ? { append_to_response: 'alternative_titles' } : {}),
    });
  } catch (error) {
    if (esNoEncontrado(error)) {
      throw new NotFoundError('No se encontró el título solicitado');
    }
    throw error;
  }

  let identidadCine;
  if (incluirIdentidadCine) {
    const datos = validateExternalResponse(
      identidadPeliculaTmdbCineSchema.refine((item) => item.id === tmdbId),
      response,
      'TMDB',
    );
    identidadCine = {
      nombres: [
        datos.title,
        datos.original_title,
        ...(datos.alternative_titles?.titles ?? [])
          .filter((item) => item.iso_3166_1 === REGION_CARTELERA)
          .map((item) => item.title),
      ].filter(Boolean),
      anio: parseYear(datos.release_date),
      duracion: datos.runtime ?? null,
    };
  }
  return {
    ...normalizarBase(response, tipo),
    sinopsis: obtenerTexto(response?.overview),
    ...(identidadCine ? { identidadCine } : {}),
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

function normalizarOfertas(response) {
  const regiones = response?.results;
  if (!regiones || typeof regiones !== 'object' || Array.isArray(regiones)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(regiones).map(([region, datosRegion]) => [
      region,
      {
        enlaceTmdb: httpUrlSchema.safeParse(datosRegion?.link).data ?? null,
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
    if (esNoEncontrado(error)) {
      return {};
    }
    throw error;
  }
}

export function obtenerOfertas({ tipo, tmdbId }) {
  return ofertasCache.getOrSet(`${tipo}:${tmdbId}`, () => consultarOfertas(tipo, tmdbId));
}

export function listarIdsPeliculasEnCartelera() {
  return cartelerasCache.getOrSet(`ids:${REGION_CARTELERA}`, async () => {
    const ids = new Set();
    const totalesInformados = [];
    let cantidadRecibida = 0;
    let totalPaginas = 1;
    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      const respuesta = validateExternalResponse(
        respuestaIdsCarteleraSchema,
        await tmdbRequest('/movie/now_playing', { region: REGION_CARTELERA, page: pagina }),
      );
      const esUltima = pagina >= respuesta.total_pages;
      if (
        respuesta.page !== pagina ||
        (pagina > 1 && respuesta.total_pages !== totalPaginas) ||
        (!esUltima && respuesta.results.length !== TMDB_CONFIG.RESULTADOS_POR_PAGINA)
      ) {
        throw new ExternalServiceError('TMDB', new Error('Cartelera incompleta'));
      }
      if (respuesta.total_pages > CARTELERA_CONFIG.MAX_PAGINAS_INDICE) {
        throw new ExternalServiceError(
          'TMDB',
          new Error('La cartelera supera el presupuesto de consulta'),
        );
      }
      totalPaginas = respuesta.total_pages;
      totalesInformados.push(respuesta.total_results);
      cantidadRecibida += respuesta.results.length;
      for (const pelicula of respuesta.results) ids.add(pelicula.id);
    }
    if (
      ids.size !== cantidadRecibida ||
      ids.size < Math.min(...totalesInformados) ||
      ids.size > Math.max(...totalesInformados)
    ) {
      throw new ExternalServiceError('TMDB', new Error('Cartelera incompleta'));
    }
    return [...ids];
  });
}
