export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Único punto de acceso del front a la API. Las cookies de sesión viajan solas
 * (mismo origen gracias al proxy de Vite). Devuelve `data` o lanza ApiError.
 *
 * @param {string} path Ej: '/plataformas'
 * @param {{ method?: string, body?: unknown, params?: Record<string, unknown> }} [options]
 */
export async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError({
      status: 0,
      code: 'NETWORK',
      message: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.',
    });
  }

  const content = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: content?.error?.code ?? 'UNKNOWN',
      message: content?.error?.message ?? 'No se pudo completar la operación',
      details: content?.error?.details,
    });
  }
  return content?.data;
}
