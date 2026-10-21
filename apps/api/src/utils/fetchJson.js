import { ExternalServiceError } from '../errors/index.js';

export async function fetchJson(url, { service, headers = {}, timeoutMs }) {
  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new ExternalServiceError(service, error);
  }

  if (!response.ok) {
    const cause = new Error(`HTTP ${response.status} en ${new URL(url).pathname}`);
    cause.status = response.status;
    throw new ExternalServiceError(service, cause);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ExternalServiceError(service, error);
  }
}
