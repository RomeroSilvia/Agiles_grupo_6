import { httpUrlSchema } from '@buscador/shared/schemas';

function esEnlaceValido(enlace) {
  return httpUrlSchema.safeParse(enlace).success;
}

export function obtenerDestinoPlataforma({ deepLink, urlHome }) {
  if (esEnlaceValido(deepLink)) {
    return { href: deepLink, esDeepLink: true };
  }
  if (esEnlaceValido(urlHome)) {
    return { href: urlHome, esDeepLink: false };
  }
  return null;
}
