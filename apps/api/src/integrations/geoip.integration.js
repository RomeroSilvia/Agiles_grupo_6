import { BlockList, isIP } from 'node:net';
import { regionSchema } from '@buscador/shared/schemas';
import { ExternalServiceError } from '../errors/index.js';

const BASE_URL = 'https://api.country.is/';
const TIMEOUT_MS = 3000;
const NON_PUBLIC_IPS = new BlockList();

for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]) {
  NON_PUBLIC_IPS.addSubnet(address, prefix);
}

for (const [address, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['2001:db8::', 32],
  ['ff00::', 8],
]) {
  NON_PUBLIC_IPS.addSubnet(address, prefix, 'ipv6');
}

/** Consulta únicamente el país; la IP no se guarda ni se devuelve al cliente. */
export async function getRegionByIp(ip) {
  const mappedIp = ip?.startsWith('::ffff:') ? ip.slice(7) : null;
  const normalizedIp = isIP(mappedIp) === 4 ? mappedIp : ip;
  const family = isIP(normalizedIp);
  if (!family || NON_PUBLIC_IPS.check(normalizedIp, family === 4 ? 'ipv4' : 'ipv6')) {
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
