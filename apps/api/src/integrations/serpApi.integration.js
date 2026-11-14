import { env } from '../config/env.config.js';
import {
  CORRESPONDENCIAS_PELICULAS_CINE,
  FUNCIONES_CINE_CONFIG,
  LUGARES_CINE,
} from '../config/funcionesCine.config.js';
import { ExternalServiceError } from '../errors/index.js';
import { respuestaSerpApiSchema } from '../models/funcionCine.model.js';
import {
  normalizarObservacionesCine,
  resolverFechaSerpApi,
  resolverHoraSerpApi,
} from '../services/funcionCine.normalizer.js';
import { fetchJson } from '../utils/fetchJson.js';
import { createTtlCache } from '../utils/ttlCache.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

const cache = createTtlCache({
  ttlMs: FUNCIONES_CINE_CONFIG.SERPAPI_TTL_MS,
  maxEntries: FUNCIONES_CINE_CONFIG.CACHE_MAX_ENTRIES,
});
const presupuesto = { mes: '', usadas: 0, solicitudes: [], agotado: false };

function errorCuota() {
  const cause = new Error('El cupo de SerpApi está agotado; no se reintenta automáticamente');
  cause.quota = true;
  return new ExternalServiceError('SerpApi: cupo de consultas agotado', cause);
}

function reservarConsulta() {
  const mes = new Date().toISOString().slice(0, 7);
  if (presupuesto.mes !== mes) {
    presupuesto.mes = mes;
    presupuesto.usadas = 0;
    presupuesto.agotado = false;
  }
  presupuesto.solicitudes = presupuesto.solicitudes.filter(
    (instante) => instante > Date.now() - 3_600_000,
  );
  if (presupuesto.agotado || presupuesto.usadas >= 250 || presupuesto.solicitudes.length >= 50)
    throw errorCuota();
  presupuesto.usadas += 1;
  presupuesto.solicitudes.push(Date.now());
}

export function obtenerFuncionesSerpApi({ pelicula, ciudad, desde, hasta }) {
  return cache.getOrSet(
    `${pelicula.tmdbId}:${ciudad.id}:${desde}:${FUNCIONES_CINE_CONFIG.VERSION_MAPEOS}`,
    async () => {
      if (!env.SERPAPI_API_KEY || !ciudad.serpApiLocation || !ciudad.evidenciaPorFuente.serpApi) {
        throw new ExternalServiceError('SerpApi: falta clave o ubicación verificada');
      }
      if (typeof pelicula.nombre !== 'string' || !pelicula.nombre.trim()) {
        throw new ExternalServiceError('SerpApi: la película no tiene un nombre verificado');
      }
      reservarConsulta();
      const url = new URL('https://serpapi.com/search');
      for (const [key, value] of Object.entries({
        engine: 'google',
        q: `${pelicula.nombre} horarios cine ${ciudad.nombre}`,
        location: ciudad.serpApiLocation,
        gl: 'ar',
        hl: 'es',
        api_key: env.SERPAPI_API_KEY,
      }))
        url.searchParams.set(key, value);
      let respuesta;
      try {
        respuesta = validateExternalResponse(
          respuestaSerpApiSchema,
          await fetchJson(url, { service: 'SerpApi', timeoutMs: 15_000 }),
          'SerpApi',
        );
      } catch (error) {
        if (error.cause?.status === 429) {
          presupuesto.agotado = true;
          throw errorCuota();
        }
        // El error original puede contener la URL autenticada. No conservarlo ni registrarlo.
        throw new ExternalServiceError(
          'SerpApi',
          new Error('La fuente falló o devolvió una estructura inválida'),
        );
      }
      if (respuesta.error) {
        if (/limit|quota|credit|searches/i.test(respuesta.error)) {
          presupuesto.agotado = true;
          throw errorCuota();
        }
        throw new ExternalServiceError(
          'SerpApi',
          new Error('La fuente informó un error de consulta'),
        );
      }
      const fuente = {
        fuenteId: 'serpapi',
        registroId: null,
        url: 'https://serpapi.com/showtimes-results',
        consultadoEn: new Date().toISOString(),
        actualizadoEn: null,
      };
      const observaciones = (respuesta.showtimes ?? []).flatMap((dia) => {
        const fechaLocal = resolverFechaSerpApi(dia, desde, hasta);
        return (dia.theaters ?? []).flatMap((cine) =>
          cine.showing.flatMap((version) =>
            version.time.map((hora) => ({
              fuenteId: 'serpapi',
              registroId: null,
              peliculaNombre: respuesta.knowledge_graph?.title ?? null,
              peliculaRegistroId: respuesta.knowledge_graph?.kgmid ?? null,
              cineRegistroId: null,
              cineNombre: cine.name,
              direccion: cine.address ?? null,
              fechaLocal,
              horaLocal: resolverHoraSerpApi(hora),
              formato: version.type ?? null,
              sala: null,
              idioma: null,
              subtitulos: null,
            })),
          ),
        );
      });
      const resultado = normalizarObservacionesCine({
        observaciones,
        ciudad,
        tmdbId: pelicula.tmdbId,
        desde,
        hasta,
        fuente,
        lugares: LUGARES_CINE,
        correspondencias: CORRESPONDENCIAS_PELICULAS_CINE,
        estructuraPresente:
          respuesta.showtimes !== undefined &&
          !respuesta.showtimes.some((dia) => dia.theaters === undefined),
      });
      // La variante por películas no identifica el establecimiento: se informa sin adjudicarlo.
      return resultado;
    },
  );
}
