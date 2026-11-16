import { httpUrlSchema } from '@buscador/shared/schemas';
import {
  SERVICIO_POR_TMDB_PROVIDER_ID,
  STREAMING_AVAILABILITY_CONFIG,
} from '../config/streamingAvailability.config.js';

export function esDeepLinkDePlataforma(enlace, { tmdbProviderId }) {
  const resultado = httpUrlSchema.safeParse(enlace);
  const servicio = SERVICIO_POR_TMDB_PROVIDER_ID[tmdbProviderId];
  if (
    !resultado.success ||
    !servicio ||
    resultado.data.length > STREAMING_AVAILABILITY_CONFIG.MAX_LARGO_DEEP_LINK
  ) {
    return false;
  }

  const { protocol, hostname } = new URL(resultado.data);
  return (
    protocol === 'https:' &&
    servicio.dominios.some((dominio) => hostname === dominio || hostname.endsWith(`.${dominio}`))
  );
}
