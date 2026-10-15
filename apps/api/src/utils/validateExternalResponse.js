import { ExternalServiceError } from '../errors/index.js';

export function validateExternalResponse(schema, data, service = 'TMDB') {
  const resultado = schema.safeParse(data);

  if (!resultado.success) {
    throw new ExternalServiceError(service, resultado.error);
  }

  return resultado.data;
}
