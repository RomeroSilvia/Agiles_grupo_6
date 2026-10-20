import { httpUrlSchema } from '@buscador/shared/schemas';
import { env } from '../config/env.config.js';
import {
  STREAMING_AVAILABILITY_CONFIG,
  TIPO_OFERTA_POR_TIPO_STREAMING_AVAILABILITY,
} from '../config/streamingAvailability.config.js';
import { RUTA_TMDB_POR_TIPO } from '../config/tmdb.config.js';
import { ExternalServiceError } from '../errors/index.js';
import { fetchJson } from '../utils/fetchJson.js';

const SERVICE = 'Streaming Availability';

function normalizarOpcion(opcion) {
  const servicio = opcion?.service?.id;
  const tipoOferta = TIPO_OFERTA_POR_TIPO_STREAMING_AVAILABILITY[opcion?.type];
  const deepLink = httpUrlSchema.safeParse(opcion?.link).data;

  return typeof servicio === 'string' && tipoOferta && deepLink
    ? { servicio, tipoOferta, deepLink }
    : null;
}

function normalizarOpciones(response, region) {
  const opciones = response?.streamingOptions?.[region.toLowerCase()];
  return Array.isArray(opciones) ? opciones.map(normalizarOpcion).filter(Boolean) : [];
}

/**
 * Deep links de un título en una región: [{ servicio, tipoOferta, deepLink }].
 * Descarta las opciones sin un enlace http(s) válido.
 */
export async function obtenerDeepLinks({ tipo, tmdbId, region }) {
  const ruta = RUTA_TMDB_POR_TIPO[tipo];
  if (!ruta) {
    throw new TypeError(`Tipo de título inválido: ${tipo}`);
  }
  if (!env.STREAMING_AVAILABILITY_API_KEY) {
    throw new ExternalServiceError(
      SERVICE,
      new Error('Falta configurar STREAMING_AVAILABILITY_API_KEY'),
    );
  }

  const url = new URL(`${STREAMING_AVAILABILITY_CONFIG.BASE_URL}/shows/${ruta}/${tmdbId}`);
  url.searchParams.set('country', region.toLowerCase());

  let response;
  try {
    response = await fetchJson(url, {
      service: SERVICE,
      timeoutMs: STREAMING_AVAILABILITY_CONFIG.TIMEOUT_MS,
      headers: {
        'X-RapidAPI-Key': env.STREAMING_AVAILABILITY_API_KEY,
        'X-RapidAPI-Host': STREAMING_AVAILABILITY_CONFIG.RAPIDAPI_HOST,
      },
    });
  } catch (error) {
    if (error instanceof ExternalServiceError && error.cause?.status === 404) {
      return [];
    }
    throw error;
  }

  return normalizarOpciones(response, region);
}
