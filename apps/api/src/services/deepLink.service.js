import { httpUrlSchema } from '@buscador/shared/schemas';
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
import { createTtlCache } from '../utils/ttlCache.js';

const deepLinksCache = createTtlCache({
  ttlMs: STREAMING_AVAILABILITY_CONFIG.CACHE_TTL_MS,
  maxEntries: STREAMING_AVAILABILITY_CONFIG.CACHE_MAX_ENTRIES,
});

function obtenerVentanaUtc(ahora) {
  const inicio = new Date(ahora);
  inicio.setUTCHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setUTCDate(fin.getUTCDate() + 1);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

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

async function consultarConReserva({ tipo, tmdbId, region }) {
  // Sin credenciales no hay consulta externa que reservar.
  if (!env.STREAMING_AVAILABILITY_API_KEY) {
    return streamingAvailabilityIntegration.obtenerDeepLinks({ tipo, tmdbId, region });
  }

  const sincronizacion = await sincronizacionRepository.iniciar();
  const { inicio, fin } = obtenerVentanaUtc(sincronizacion.iniciadaEn ?? new Date());
  let errorConsulta = null;

  try {
    const reservada = await sincronizacionRepository.reservarConsultaDisponibilidad(
      sincronizacion.id,
      {
        inicio,
        fin,
        limite: STREAMING_AVAILABILITY_CONFIG.MAX_REQUESTS_PER_DAY,
      },
    );

    if (!reservada) {
      errorConsulta =
        'Límite diario de ' +
        STREAMING_AVAILABILITY_CONFIG.MAX_REQUESTS_PER_DAY +
        ' consultas de disponibilidad alcanzado.';
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

function claveOferta(plataformaId, tipoOferta) {
  return `${plataformaId}:${tipoOferta}`;
}

// Solo las plataformas que Streaming Availability conoce pueden tener deep link.
function listarOfertasEnlazables(ofertas) {
  return ofertas.flatMap(({ tipoOferta, plataformas }) =>
    plataformas
      .filter(({ tmdbProviderId }) => SERVICIO_POR_TMDB_PROVIDER_ID[tmdbProviderId])
      .map((plataforma) => ({ plataforma, tipoOferta })),
  );
}

function esDeepLinkDePlataforma(enlace, plataforma) {
  const resultado = httpUrlSchema.safeParse(enlace);
  if (!resultado.success) {
    return false;
  }

  const { dominios } = SERVICIO_POR_TMDB_PROVIDER_ID[plataforma.tmdbProviderId];
  const { hostname } = new URL(resultado.data);
  return dominios.some((dominio) => hostname === dominio || hostname.endsWith(`.${dominio}`));
}

// Solo acepta el enlace del mismo tipo de oferta: el de otro tipo abriría una oferta
// distinta a la que se muestra (por ejemplo, el alquiler en lugar de la suscripción).
function elegirDeepLink({ plataforma, tipoOferta }, opciones) {
  const { servicio } = SERVICIO_POR_TMDB_PROVIDER_ID[plataforma.tmdbProviderId];
  const elegida = opciones.find(
    (opcion) =>
      opcion.servicio === servicio &&
      opcion.tipoOferta === tipoOferta &&
      esDeepLinkDePlataforma(opcion.deepLink, plataforma),
  );
  return elegida?.deepLink ?? null;
}

// Devuelve los deep links guardados solo si hay uno vigente para cada oferta (null incluido).
async function leerGuardados({ tipo, tmdbId, region, enlazables }) {
  const titulo = await tituloRepository.obtenerPorTmdbIdYTipo(tmdbId, tipo);
  if (!titulo) {
    return null;
  }

  const plataformas = new Map(enlazables.map(({ plataforma }) => [plataforma.id, plataforma]));
  const limite = Date.now() - STREAMING_AVAILABILITY_CONFIG.VIGENCIA_DEEP_LINK_MS;
  const disponibilidades = await disponibilidadRepository.listarPorTituloYRegion(titulo.id, region);
  const guardados = new Map(
    disponibilidades
      .filter(
        ({ plataformaId, verificadaEn }) =>
          plataformas.has(plataformaId) && verificadaEn.getTime() > limite,
      )
      .map(({ plataformaId, tipoOferta, deepLink }) => [
        claveOferta(plataformaId, tipoOferta),
        esDeepLinkDePlataforma(deepLink, plataformas.get(plataformaId)) ? deepLink : null,
      ]),
  );

  const estanTodos = enlazables.every(({ plataforma, tipoOferta }) =>
    guardados.has(claveOferta(plataforma.id, tipoOferta)),
  );
  return estanTodos ? guardados : null;
}

async function guardar({ tipo, tmdbId, region, enlazables, deepLinks }) {
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
      deepLink: deepLinks.get(claveOferta(plataforma.id, tipoOferta)),
      fuenteId,
      verificadaEn,
    })),
  );
}

async function resolverDeepLinks({ tipo, tmdbId, region, enlazables }) {
  const guardados = await leerGuardados({ tipo, tmdbId, region, enlazables });
  if (guardados) {
    return guardados;
  }

  let opciones;
  try {
    opciones = await consultarConReserva({ tipo, tmdbId, region });
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      console.error(error);
      return new Map();
    }
    throw error;
  }

  if (opciones === null) {
    return new Map();
  }

  const deepLinks = new Map(
    enlazables.map((oferta) => [
      claveOferta(oferta.plataforma.id, oferta.tipoOferta),
      elegirDeepLink(oferta, opciones),
    ]),
  );

  try {
    await guardar({ tipo, tmdbId, region, enlazables, deepLinks });
  } catch (error) {
    console.error('No se pudieron guardar los deep links', error);
  }

  return deepLinks;
}

/** Suma a cada plataforma de las ofertas su deep link (null si no tiene uno válido). */
export async function agregarDeepLinks({ tipo, tmdbId, region, ofertas }) {
  const enlazables = listarOfertasEnlazables(ofertas);
  const deepLinks =
    enlazables.length === 0
      ? new Map()
      : await deepLinksCache.getOrSet(`${tipo}:${tmdbId}:${region}`, () =>
          resolverDeepLinks({ tipo, tmdbId, region, enlazables }),
        );

  return ofertas.map(({ tipoOferta, plataformas }) => ({
    tipoOferta,
    plataformas: plataformas.map((plataforma) => ({
      ...plataforma,
      deepLink: deepLinks.get(claveOferta(plataforma.id, tipoOferta)) ?? null,
    })),
  }));
}
