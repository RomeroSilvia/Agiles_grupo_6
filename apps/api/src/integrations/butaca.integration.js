import { env } from '../config/env.config.js';
import {
  BUTACA_VERIFICADO,
  CORRESPONDENCIAS_PELICULAS_CINE,
  FUNCIONES_CINE_CONFIG,
  LUGARES_CINE,
} from '../config/funcionesCine.config.js';
import { ExternalServiceError } from '../errors/index.js';
import {
  respuestaCinesButacaSchema,
  respuestaPeliculasButacaSchema,
  respuestaFuncionesButacaSchema,
} from '../models/funcionCine.model.js';
import {
  normalizarObservacionesCine,
  corresponderPeliculaCine,
  corresponderCarteleraButaca,
  normalizarTextoCine,
} from '../services/funcionCine.normalizer.js';
import { fetchJson } from '../utils/fetchJson.js';
import { createTtlCache } from '../utils/ttlCache.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

// Adaptación de la superficie anónima de Butaca, MIT; ver docs/licenses/butaca.txt.
const BASE_URL = 'https://bff.cinemark.com.ar/api';
const cache = createTtlCache({
  ttlMs: FUNCIONES_CINE_CONFIG.BUTACA_TTL_MS,
  maxEntries: FUNCIONES_CINE_CONFIG.CACHE_MAX_ENTRIES,
});
const cinesCache = createTtlCache({ ttlMs: FUNCIONES_CINE_CONFIG.BUTACA_TTL_MS, maxEntries: 1 });

export function estaHabilitadoButaca() {
  return env.BUTACA_ENABLED === 'true' && BUTACA_VERIFICADO;
}

async function consultarButaca(path, params, schema) {
  if (!estaHabilitadoButaca())
    throw new ExternalServiceError('Butaca: complemento no habilitado o sin verificación');
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return validateExternalResponse(
    schema,
    await fetchJson(url, {
      service: 'Butaca / Cinemark',
      headers: { country: 'AR' },
      timeoutMs: 15_000,
    }),
    'Butaca / Cinemark',
  ).data;
}

export function listarCinesButaca() {
  return cinesCache.getOrSet('cinemark-ar', () =>
    consultarButaca('/cinema/theaters', { limit: '100' }, respuestaCinesButacaSchema),
  );
}

export function obtenerFuncionesButaca({ pelicula, ciudad, desde, hasta }) {
  if (!estaHabilitadoButaca())
    return Promise.reject(
      new ExternalServiceError('Butaca: complemento no habilitado o sin verificación'),
    );
  return cache.getOrSet(
    `${pelicula.tmdbId}:${ciudad.id}:${desde}:${FUNCIONES_CINE_CONFIG.VERSION_MAPEOS}`,
    async () => {
      const cines = await listarCinesButaca();
      const observaciones = [];
      const correspondencias = [...CORRESPONDENCIAS_PELICULAS_CINE];
      let estructuraPresente = true;
      let sucursalesRespondidas = 0;
      let errorSucursal;
      for (const mapeo of ciudad.butacaCines) {
        const lugar = LUGARES_CINE.find(
          (item) =>
            item.ciudadId === ciudad.id &&
            item.fuentes.some(
              (fuente) => fuente.fuenteId === 'butaca' && fuente.registroId === String(mapeo.id),
            ),
        );
        const cine = cines.find(
          (item) =>
            String(item.id) === String(mapeo.id) &&
            item.slug === mapeo.slug &&
            lugar &&
            normalizarTextoCine(item.address) === normalizarTextoCine(lugar.direccion),
        );
        if (!cine) {
          estructuraPresente = false;
          continue;
        }
        try {
          const peliculas = await consultarButaca(
            '/cinema/movies',
            { theater: String(cine.id) },
            respuestaPeliculasButacaSchema,
          );
          const revisadas = peliculas.filter((item) =>
            corresponderPeliculaCine({
              fuenteId: 'butaca',
              registroId: item.corporateId,
              nombre: item.title,
              tmdbId: pelicula.tmdbId,
              correspondencias,
            }),
          );
          if (!revisadas.length) {
            const nuevas = corresponderCarteleraButaca(peliculas, pelicula);
            for (const nueva of nuevas) {
              if (
                !correspondencias.some(
                  (item) =>
                    item.fuenteId === nueva.fuenteId && item.registroId === nueva.registroId,
                )
              )
                correspondencias.push(nueva);
            }
          }
          const candidatas = peliculas.filter((item) =>
            corresponderPeliculaCine({
              fuenteId: 'butaca',
              registroId: item.corporateId,
              nombre: item.title,
              tmdbId: pelicula.tmdbId,
              correspondencias,
            }),
          );
          if (peliculas.length && !candidatas.length) estructuraPresente = false;
          for (const candidata of candidatas) {
            const horarios = await consultarButaca(
              '/cinema/showtimes',
              { movieCorporateId: candidata.corporateId, theater: String(cine.id) },
              respuestaFuncionesButacaSchema,
            );
            for (const horario of horarios) {
              if (
                String(horario.theaterId) !== String(cine.id) ||
                horario.corporateId !== candidata.corporateId
              ) {
                estructuraPresente = false;
                continue;
              }
              // El Z del campo bruto representa componentes locales, según contrato de Cinemark.
              const partes = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):([0-5]\d)(?:\.\d+)?Z?$/.exec(
                horario.sessionDateTime,
              );
              const fechaLocal = partes?.[1] ?? null;
              const horaLocal = partes?.[2] ?? null;
              observaciones.push({
                fuenteId: 'butaca',
                registroId: horario.sessionId,
                peliculaRegistroId: horario.corporateId,
                peliculaNombre: horario.movieName,
                cineRegistroId: String(cine.id),
                cineNombre: cine.name,
                direccion: cine.address,
                fechaLocal: horario.sessionDisplayDate === fechaLocal ? fechaLocal : null,
                horaLocal,
                sala: horario.theaterRoom ?? null,
                formato: horario.sessionFormat ?? null,
                idioma: horario.language?.shortName ?? null,
                subtitulos: null,
              });
            }
          }
          sucursalesRespondidas += 1;
        } catch (error) {
          if (!(error instanceof ExternalServiceError)) throw error;
          estructuraPresente = false;
          errorSucursal = error;
        }
      }
      if (errorSucursal && !sucursalesRespondidas && !observaciones.length) throw errorSucursal;
      const fuente = {
        fuenteId: 'butaca',
        registroId: null,
        url: 'https://bff.cinemark.com.ar/api/cinema/showtimes',
        consultadoEn: new Date().toISOString(),
        actualizadoEn: null,
      };
      return normalizarObservacionesCine({
        observaciones,
        ciudad,
        tmdbId: pelicula.tmdbId,
        desde,
        hasta,
        fuente,
        lugares: LUGARES_CINE,
        correspondencias,
        estructuraPresente,
      });
    },
  );
}
