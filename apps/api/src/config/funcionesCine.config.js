import {
  URL_SITIO_CINEMARK,
  HORIZONTE_FUNCIONES_CINE_DIAS,
  MAX_FUNCIONES_CINE,
} from '@buscador/shared/constants';
import { CINES_CINEMARK, EVIDENCIA_CINEMARK } from './cinesCinemark.config.js';

export const FUNCIONES_CINE_CONFIG = Object.freeze({
  VERSION_MAPEOS: '3',
  RATE_LIMIT: Object.freeze({ maxRequests: 5, windowMs: 60_000 }),
  MAX_CONCURRENT_REQUESTS: 2,
  MAX_FUNCIONES: MAX_FUNCIONES_CINE,
  HORIZONTE_DIAS: HORIZONTE_FUNCIONES_CINE_DIAS,
  TIMEOUT_MS: 15_000,
  BUTACA_BASE_URL: 'https://bff.cinemark.com.ar/api',
  BUTACA_TTL_MS: 900_000,
  CACHE_MAX_ENTRIES: 100,
});

// Agregar únicamente correspondencias revisadas con evidencia de identidad y municipio.
export const LUGARES_CINE = Object.freeze(
  CINES_CINEMARK.map((cine) => ({
    clave: `cinemark-${cine.id}`,
    ciudadId: cine.ciudadId,
    nombre: `Cinemark ${cine.nombre}`,
    direccion: cine.direccion,
    evidencia: EVIDENCIA_CINEMARK.evidencia,
    urlSitio: URL_SITIO_CINEMARK,
    fuentes: [{ fuenteId: 'butaca', registroId: String(cine.id) }],
  })),
);
export const CORRESPONDENCIAS_PELICULAS_CINE = Object.freeze([]);

// Verificación operativa de las lecturas anónimas; no representa un SLA del proveedor.
export const BUTACA_VERIFICADO = true;
