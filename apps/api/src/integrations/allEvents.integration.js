import { env } from '../config/env.config.js';
import { ZONA_HORARIA_EVENTOS } from '@buscador/shared/constants';
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
const limitar = createConcurrencyLimiter(2);
const FECHAS_PROVEEDOR = { hoy: 'today', manana: 'tomorrow', fin_de_semana: 'weekend' };
const formateadorFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA_EVENTOS,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
let diaPresupuesto;
let solicitudesDelDia = 0;

export function listarEventosAllEvents({ categoria, fecha, pagina }) {
  if (!env.ALLEVENTS_API_KEY) {
    return Promise.reject(
      new ExternalServiceError('los eventos de La Plata: la fuente no está configurada'),
    );
  }
  const diaLocal = formateadorFecha.format(new Date());
  return cache.getOrSet(`${diaLocal}:${categoria}:${fecha}:${pagina}`, () =>
    limitar(async () => {
      const diaActual = new Date().toISOString().slice(0, 10);
      if (diaActual !== diaPresupuesto) {
        diaPresupuesto = diaActual;
        solicitudesDelDia = 0;
      }
      if (solicitudesDelDia >= EVENTOS_CONFIG.MAX_REQUESTS_PER_DAY) {
        throw new ExternalServiceError(
          'los eventos de La Plata: se alcanzó el límite diario de consultas',
        );
      }
      const url = new URL('https://api.api.sh/allevents/v1/events');
      url.searchParams.set('city', 'la-plata');
      url.searchParams.set('page', String(pagina));
      url.searchParams.set('raw', '0');
      if (categoria !== 'all') {
        url.searchParams.set('category', categoria);
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
        respuesta.page !== pagina ||
        (respuesta.next_page !== null && respuesta.next_page <= pagina)
      ) {
        throw new ExternalServiceError(
          'los eventos de La Plata: paginación inválida del proveedor',
        );
      }
      return { ...respuesta, consultadoEn: respuesta.fetched_at ?? new Date().toISOString() };
    }),
  );
}
