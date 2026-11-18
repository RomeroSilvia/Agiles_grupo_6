import {
  SERVICIO_POR_TMDB_PROVIDER_ID,
  STREAMING_AVAILABILITY_CONFIG,
} from '../config/streamingAvailability.config.js';
import { env } from '../config/env.config.js';
import { DatabaseError, ExternalServiceError } from '../errors/index.js';
import * as streamingAvailabilityIntegration from '../integrations/streamingAvailability.integration.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as disponibilidadRepository from '../repositories/disponibilidad.repository.js';
import * as fuenteDatosRepository from '../repositories/fuenteDatos.repository.js';
import * as sincronizacionRepository from '../repositories/sincronizacion.repository.js';
import * as tituloRepository from '../repositories/titulo.repository.js';
import { claveOferta } from '../models/disponibilidad.model.js';
import { getUtcDayWindow } from '../utils/date.js';
import { createTtlCache } from '../utils/ttlCache.js';
import { esDeepLinkDePlataforma } from './deepLink.validator.js';

const deepLinksCache = createTtlCache({
  ttlMs: STREAMING_AVAILABILITY_CONFIG.CACHE_TTL_MS,
  maxEntries: STREAMING_AVAILABILITY_CONFIG.CACHE_MAX_ENTRIES,
});

const idiomasCache = createTtlCache({
  ttlMs: STREAMING_AVAILABILITY_CONFIG.VIGENCIA_DEEP_LINK_MS,
  maxEntries: STREAMING_AVAILABILITY_CONFIG.CACHE_MAX_ENTRIES,
});

function mensajeError(error) {
  return error instanceof Error ? error.message : 'Error desconocido';
}

async function finalizarConsulta(sincronizacionId, error) {
  try {
    await sincronizacionRepository.finalizar(sincronizacionId, {
      finalizadaEn: new Date().toISOString(),
      error,
    });
  } catch (errorAlRegistrar) {
    console.error(
      'No se pudo registrar la consulta interactiva de disponibilidad',
      errorAlRegistrar,
    );
  }
}

async function consultarConReserva({
  tipo,
  tmdbId,
  region,
  limite = STREAMING_AVAILABILITY_CONFIG.MAX_REQUESTS_PER_DAY,
}) {
  // Sin credenciales no hay consulta externa que reservar.
  if (!env.STREAMING_AVAILABILITY_API_KEY) {
    return streamingAvailabilityIntegration.obtenerDeepLinks({ tipo, tmdbId, region });
  }

  const sincronizacion = await sincronizacionRepository.iniciar();
  const { start: inicio, end: fin } = getUtcDayWindow(sincronizacion.iniciadaEn ?? new Date());
  let errorConsulta = null;

  try {
    const reservada = await sincronizacionRepository.reservarConsultaDisponibilidad(
      sincronizacion.id,
      {
        inicio,
        fin,
        limite,
      },
    );

    if (!reservada) {
      errorConsulta = 'Límite diario de ' + limite + ' consultas de disponibilidad alcanzado.';
      return null;
    }

    return await streamingAvailabilityIntegration.obtenerDeepLinks({ tipo, tmdbId, region });
  } catch (error) {
    errorConsulta = mensajeError(error);
    throw error;
  } finally {
    await finalizarConsulta(sincronizacion.id, errorConsulta);
  }
}

// Solo las plataformas que Streaming Availability conoce pueden tener deep link.
function listarOfertasEnlazables(ofertas) {
  return ofertas.flatMap(({ tipoOferta, plataformas }) =>
    plataformas
      .filter(({ tmdbProviderId }) => SERVICIO_POR_TMDB_PROVIDER_ID[tmdbProviderId])
      .map((plataforma) => ({ plataforma, tipoOferta })),
  );
}

// Solo acepta el enlace y los idiomas del mismo tipo de oferta: el de otro tipo abriría
// una oferta distinta a la que se muestra (por ejemplo, el alquiler en lugar de la suscripción).
function elegirDatosOferta({ plataforma, tipoOferta }, opciones) {
  const { servicio } = SERVICIO_POR_TMDB_PROVIDER_ID[plataforma.tmdbProviderId];
  const coincidentes = opciones.filter(
    (opcion) =>
      opcion.servicio === servicio &&
      opcion.tipoOferta === tipoOferta &&
      esDeepLinkDePlataforma(opcion.deepLink, plataforma),
  );

  return {
    deepLink: coincidentes[0]?.deepLink ?? null,
    audios: [...new Set(coincidentes.flatMap((opcion) => opcion.audios ?? []))],
    subtitulos: [...new Set(coincidentes.flatMap((opcion) => opcion.subtitulos ?? []))],
  };
}

// Devuelve los deep links guardados y vigentes de las ofertas (null si el guardado no es válido).
async function leerVigentes({ tipo, tmdbId, region, enlazables }) {
  const titulo = await tituloRepository.obtenerPorTmdbIdYTipo(tmdbId, tipo);
  if (!titulo) {
    return new Map();
  }

  const plataformas = new Map(enlazables.map(({ plataforma }) => [plataforma.id, plataforma]));
  const limite = Date.now() - STREAMING_AVAILABILITY_CONFIG.VIGENCIA_DEEP_LINK_MS;
  const disponibilidades = await disponibilidadRepository.listarPorTituloYRegion(titulo.id, region);
  return new Map(
    disponibilidades
      .filter(
        ({ plataformaId, verificadaEn }) =>
          plataformas.has(plataformaId) && verificadaEn.getTime() > limite,
      )
      .map(({ plataformaId, tipoOferta, deepLink }) => [
        claveOferta({ plataformaId, tipoOferta }),
        {
          deepLink: esDeepLinkDePlataforma(deepLink, plataformas.get(plataformaId))
            ? deepLink
            : null,
          audios: null,
          subtitulos: null,
        },
      ]),
  );
}

// Hay un guardado vigente para cada oferta (null incluido).
function estanCompletos(guardados, enlazables) {
  return enlazables.every(({ plataforma, tipoOferta }) =>
    guardados.has(claveOferta({ plataformaId: plataforma.id, tipoOferta })),
  );
}

function combinarConIdiomas(guardados, idiomas) {
  return new Map(
    [...guardados.entries()].map(([clave, guardado]) => {
      const datosIdiomas = idiomas.get(clave);
      return [
        clave,
        {
          deepLink: guardado.deepLink,
          audios: datosIdiomas?.audios ?? [],
          subtitulos: datosIdiomas?.subtitulos ?? [],
        },
      ];
    }),
  );
}

async function guardar({ tipo, tmdbId, region, enlazables, datosPorOferta }) {
  const [titulo, fuenteId] = await Promise.all([
    tmdbIntegration.obtenerDetalle(tipo, tmdbId),
    fuenteDatosRepository.obtenerIdPorNombre(STREAMING_AVAILABILITY_CONFIG.FUENTE_DISPONIBILIDAD),
  ]);
  if (!fuenteId) {
    throw new DatabaseError(new Error('Falta la fuente de datos de la disponibilidad'));
  }

  const { id: tituloId } = await tituloRepository.guardarDesdeTmdb(titulo);
  const verificadaEn = new Date();
  await disponibilidadRepository.guardarDeepLinks(
    enlazables.map(({ plataforma, tipoOferta }) => ({
      tituloId,
      plataformaId: plataforma.id,
      region,
      tipoOferta,
      deepLink:
        datosPorOferta.get(claveOferta({ plataformaId: plataforma.id, tipoOferta }))?.deepLink ??
        null,
      fuenteId,
      verificadaEn,
    })),
  );
}

async function resolverDeepLinks({ tipo, tmdbId, region, enlazables }) {
  const clave = `${tipo}:${tmdbId}:${region}`;
  const guardados = await leerVigentes({ tipo, tmdbId, region, enlazables });
  const completos = estanCompletos(guardados, enlazables);
  const idiomas = idiomasCache.get(clave);

  if (completos && idiomas) {
    return { datosPorOferta: combinarConIdiomas(guardados, idiomas), idiomasDisponibles: true };
  }

  const limite = completos
    ? STREAMING_AVAILABILITY_CONFIG.MAX_REQUESTS_IDIOMAS_PER_DAY
    : STREAMING_AVAILABILITY_CONFIG.MAX_REQUESTS_PER_DAY;

  let opciones;
  try {
    opciones = await consultarConReserva({ tipo, tmdbId, region, limite });
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      console.error(error);
      return { datosPorOferta: guardados, idiomasDisponibles: false };
    }
    throw error;
  }

  if (opciones === null) {
    // Se mantienen los deep links guardados; solo faltan los idiomas.
    return { datosPorOferta: guardados, idiomasDisponibles: false };
  }

  const datosPorOferta = new Map(
    enlazables.map((oferta) => [
      claveOferta({ plataformaId: oferta.plataforma.id, tipoOferta: oferta.tipoOferta }),
      elegirDatosOferta(oferta, opciones),
    ]),
  );
  idiomasCache.set(clave, datosPorOferta);

  try {
    await guardar({ tipo, tmdbId, region, enlazables, datosPorOferta });
  } catch (error) {
    console.error('No se pudieron guardar los deep links', error);
  }

  return { datosPorOferta, idiomasDisponibles: true };
}

function asignarDeepLinks(ofertas, { datosPorOferta, idiomasDisponibles }) {
  return ofertas.map(({ tipoOferta, plataformas }) => ({
    tipoOferta,
    plataformas: plataformas.map((plataforma) => {
      const datos = datosPorOferta.get(claveOferta({ plataformaId: plataforma.id, tipoOferta }));
      return {
        ...plataforma,
        deepLink: datos?.deepLink ?? null,
        audios: idiomasDisponibles ? (datos?.audios ?? []) : null,
        subtitulos: idiomasDisponibles ? (datos?.subtitulos ?? []) : null,
      };
    }),
  }));
}

/** Suma a cada plataforma de las ofertas su deep link e idiomas disponibles. */
export async function agregarDeepLinks({ tipo, tmdbId, region, ofertas }) {
  const enlazables = listarOfertasEnlazables(ofertas);
  const resultado =
    enlazables.length === 0
      ? { datosPorOferta: new Map(), idiomasDisponibles: true }
      : await deepLinksCache.getOrSet(`${tipo}:${tmdbId}:${region}`, () =>
          resolverDeepLinks({ tipo, tmdbId, region, enlazables }),
        );

  return asignarDeepLinks(ofertas, resultado);
}

/**
 * Igual que agregarDeepLinks, pero solo usa los deep links guardados y vigentes:
 * nunca consulta Streaming Availability ni gasta cupo.
 */
export async function agregarDeepLinksGuardados({ tipo, tmdbId, region, ofertas }) {
  const enlazables = listarOfertasEnlazables(ofertas);
  const datosPorOferta =
    enlazables.length === 0 ? new Map() : await leerVigentes({ tipo, tmdbId, region, enlazables });

  return asignarDeepLinks(ofertas, { datosPorOferta, idiomasDisponibles: false });
}
