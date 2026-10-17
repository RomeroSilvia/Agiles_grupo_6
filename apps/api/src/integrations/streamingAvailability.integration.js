import { env } from '../config/env.config.js';
import { STREAMING_AVAILABILITY_CONFIG } from '../config/streamingAvailability.config.js';
import { ExternalServiceError } from '../errors/index.js';
import { streamingAvailabilityResponseSchema } from '../models/streamingAvailability.model.js';
import { createConcurrencyLimiter } from '../utils/concurrencyLimiter.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

const limitarConcurrencia = createConcurrencyLimiter(
  STREAMING_AVAILABILITY_CONFIG.MAX_CONCURRENT_REQUESTS,
);

export function obtenerOfertas({ tipo, tmdbId, region }) {
  return limitarConcurrencia(() => consultarOfertas({ tipo, tmdbId, region }));
}

async function consultarOfertas({ tipo, tmdbId, region }) {
  const ruta = STREAMING_AVAILABILITY_CONFIG.RUTA_POR_TIPO[tipo];
  if (!ruta) {
    throw new TypeError(`Tipo de título inválido: ${tipo}`);
  }
  if (!env.STREAMING_AVAILABILITY_API_KEY) {
    throw new ExternalServiceError(
      'Streaming Availability',
      new Error('Falta configurar STREAMING_AVAILABILITY_API_KEY'),
    );
  }

  const pais = region.toLowerCase();
  const url = new URL(`${ruta}/${tmdbId}`, STREAMING_AVAILABILITY_CONFIG.BASE_URL);
  url.searchParams.set('country', pais);

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Rapid-API-Key': env.STREAMING_AVAILABILITY_API_KEY,
      },
      signal: AbortSignal.timeout(STREAMING_AVAILABILITY_CONFIG.REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new ExternalServiceError('Streaming Availability', error);
  }

  if (!response.ok) {
    const cause = new Error(`HTTP ${response.status} en ${url.pathname}`);
    cause.status = response.status;
    throw new ExternalServiceError('Streaming Availability', cause);
  }

  let body;
  try {
    body = await response.json();
  } catch (error) {
    throw new ExternalServiceError('Streaming Availability', error);
  }

  const resultado = validateExternalResponse(
    streamingAvailabilityResponseSchema,
    body,
    'Streaming Availability',
  );

  return resultado.streamingOptions[pais] ?? [];
}
