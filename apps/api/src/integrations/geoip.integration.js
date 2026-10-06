import { isIP } from 'node:net';
import { regionSchema } from '@buscador/shared/schemas';
import { ExternalServiceError } from '../errors/index.js';

const BASE_URL = 'https://api.country.is/';
const TIMEOUT_MS = 3000;

/** Consulta únicamente el país; la IP no se guarda ni se devuelve al cliente. */
export async function getRegionByIp(ip) {
  const normalizedIp = ip?.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (!isIP(normalizedIp) || normalizedIp === '::1' || normalizedIp.startsWith('127.')) {
    return null;
  }

  let response;
  try {
    response = await fetch(new URL(encodeURIComponent(normalizedIp), BASE_URL), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ExternalServiceError('la ubicación por IP', error);
  }

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new ExternalServiceError('la ubicación por IP', new Error(`HTTP ${response.status}`));
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new ExternalServiceError('la ubicación por IP', error);
  }

  const result = regionSchema.safeParse(
    typeof data?.country === 'string' ? data.country.toUpperCase() : data?.country,
  );
  return result.success ? result.data : null;
}
