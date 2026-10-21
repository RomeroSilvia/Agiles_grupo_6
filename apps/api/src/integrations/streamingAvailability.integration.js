import { httpUrlSchema } from '@buscador/shared/schemas';
import { env } from '../config/env.config.js';
import {
  STREAMING_AVAILABILITY_CONFIG,
  TIPO_OFERTA_POR_TIPO_STREAMING_AVAILABILITY,
} from '../config/streamingAvailability.config.js';
import { RUTA_TMDB_POR_TIPO } from '../config/tmdb.config.js';
import { ExternalServiceError } from '../errors/index.js';
import { streamingAvailabilityResponseSchema } from '../models/streamingAvailability.model.js';
import { createConcurrencyLimiter } from '../utils/concurrencyLimiter.js';
import { fetchJson } from '../utils/fetchJson.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

const SERVICE = 'Streaming Availability';
const limitarConcurrencia = createConcurrencyLimiter(
  STREAMING_AVAILABILITY_CONFIG.MAX_CONCURRENT_REQUESTS,
);

async function consultar({ tipo, tmdbId, region }) {
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

  const url = new URL(`${ruta}/${tmdbId}`, STREAMING_AVAILABILITY_CONFIG.BASE_URL);
  url.searchParams.set('country', region.toLowerCase());

  try {
    return await fetchJson(url, {
      service: SERVICE,
      timeoutMs: STREAMING_AVAILABILITY_CONFIG.TIMEOUT_MS,
      headers: {
        'X-RapidAPI-Key': env.STREAMING_AVAILABILITY_API_KEY,
        'X-RapidAPI-Host': STREAMING_AVAILABILITY_CONFIG.RAPIDAPI_HOST,
      },
    });
  } catch (error) {
    if (error instanceof ExternalServiceError && error.cause?.status === 404) {
      return null;
    }
    throw error;
  }
}

function normalizarOpciones(response, region) {
  const opciones = response?.streamingOptions?.[region.toLowerCase()];
  if (!Array.isArray(opciones)) {
    return [];
  }

  return opciones
    .map((opcion) => {
      const servicio = opcion?.service?.id;
      const tipoOferta = TIPO_OFERTA_POR_TIPO_STREAMING_AVAILABILITY[opcion?.type];
      const deepLink = httpUrlSchema.safeParse(opcion?.link).data;

      return typeof servicio === 'string' && tipoOferta && deepLink
        ? { servicio, tipoOferta, deepLink }
        : null;
    })
    .filter(Boolean);
}

/** Devuelve las ofertas de Streaming Availability para el job de sincronización. */
export function obtenerOfertas({ tipo, tmdbId, region }) {
  return limitarConcurrencia(async () => {
    const response = await consultar({ tipo, tmdbId, region });
    if (!response) {
      return [];
    }

    const resultado = validateExternalResponse(
      streamingAvailabilityResponseSchema,
      response,
      SERVICE,
    );
    return resultado.streamingOptions[region.toLowerCase()] ?? [];
  });
}

/** Deep links por título y región: [{ servicio, tipoOferta, deepLink }]. */
export function obtenerDeepLinks({ tipo, tmdbId, region }) {
  return limitarConcurrencia(async () => {
    const response = await consultar({ tipo, tmdbId, region });
    return response ? normalizarOpciones(response, region) : [];
  });
}
