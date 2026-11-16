import { env } from '../config/env.config.js';
import { ZONA_HORARIA_EVENTOS } from '@buscador/shared/constants';
import { obtenerFechaCivil } from '@buscador/shared/utils';
import { EVENTOS_CONFIG } from '../config/eventos.config.js';
import { ExternalServiceError } from '../errors/index.js';
import { respuestaAllEventsSchema } from '../models/evento.model.js';
import { fetchJson } from '../utils/fetchJson.js';
import { createTtlCache } from '../utils/ttlCache.js';
import { createConcurrencyLimiter } from '../utils/concurrencyLimiter.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

const cache = createTtlCache({
  ttlMs: EVENTOS_CONFIG.CACHE_TTL_MS,
  maxEntries: EVENTOS_CONFIG.CACHE_MAX_ENTRIES,
});
const limitar = createConcurrencyLimiter(EVENTOS_CONFIG.MAX_CONCURRENT_REQUESTS);
const FECHAS_PROVEEDOR = { hoy: 'today', manana: 'tomorrow', fin_de_semana: 'weekend' };
const CATEGORIAS_PROVEEDOR = Object.freeze({
  todas: 'all',
  musica: 'music',
  teatro: 'theatre',
  arte: 'art',
  festivales: 'festivals',
  talleres: 'workshops',
  humor: 'comedy',
  infancias: 'kids',
  deportes: 'sports',
  gastronomia: 'food-drinks',
});
let diaPresupuesto;
let solicitudesDelDia = 0;

export function listarEventosAllEvents({ categoria, fecha, pagina }) {
  if (!env.ALLEVENTS_API_KEY) {
    return Promise.reject(
      new ExternalServiceError('los eventos de La Plata: la fuente no está configurada'),
    );
  }
  const diaLocal = obtenerFechaCivil(new Date(), ZONA_HORARIA_EVENTOS);
  return cache.getOrSet(`${diaLocal}:${categoria}:${fecha}:${pagina}`, () =>
    limitar(async () => {
      const diaActual = new Date().toISOString().slice(0, 10);
      if (diaActual !== diaPresupuesto) {
        diaPresupuesto = diaActual;
        solicitudesDelDia = 0;
      }
      const limite =
        EVENTOS_CONFIG.MAX_REQUESTS_PER_DAY -
        (pagina > 1 ? EVENTOS_CONFIG.FIRST_PAGE_RESERVED_REQUESTS : 0);
      if (solicitudesDelDia >= limite) {
        throw new ExternalServiceError(
          'los eventos de La Plata: se alcanzó el límite diario de consultas',
        );
      }
      const url = new URL(EVENTOS_CONFIG.ALLEVENTS_URL);
      url.searchParams.set('city', EVENTOS_CONFIG.ALLEVENTS_CIUDAD);
      url.searchParams.set('page', String(pagina));
      url.searchParams.set('raw', '0');
      if (categoria !== 'todas') {
        url.searchParams.set('category', CATEGORIAS_PROVEEDOR[categoria]);
      }
      if (fecha !== 'todas') {
        url.searchParams.set('date', FECHAS_PROVEEDOR[fecha]);
      }
      solicitudesDelDia += 1;
      const respuesta = validateExternalResponse(
        respuestaAllEventsSchema,
        await fetchJson(url, {
          service: 'los eventos de La Plata en AllEvents',
          headers: { 'x-api-key': env.ALLEVENTS_API_KEY },
          timeoutMs: EVENTOS_CONFIG.TIMEOUT_MS,
        }),
        'los eventos de La Plata en AllEvents',
      );
      if (
        respuesta.pagina !== pagina ||
        (respuesta.siguientePagina !== null && respuesta.siguientePagina <= pagina)
      ) {
        throw new ExternalServiceError(
          'los eventos de La Plata: paginación inválida del proveedor',
        );
      }
      return respuesta;
    }),
  );
}
