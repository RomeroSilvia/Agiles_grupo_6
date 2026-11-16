import { FUENTE_ID_BUTACA } from '@buscador/shared/constants';
import * as butacaIntegration from '../integrations/butaca.integration.js';
import {
  CORRESPONDENCIAS_PELICULAS_CINE,
  FUNCIONES_CINE_CONFIG,
  LUGARES_CINE,
} from '../config/funcionesCine.config.js';
import { ExternalServiceError } from '../errors/index.js';
import {
  corresponderPeliculaCine,
  corresponderCarteleraButaca,
  consolidarSesionesButaca,
  normalizarTextoCine,
} from './funcionCine.normalizer.js';
import { createTtlCache } from '../utils/ttlCache.js';
const cache = createTtlCache({
  ttlMs: FUNCIONES_CINE_CONFIG.BUTACA_TTL_MS,
  maxEntries: FUNCIONES_CINE_CONFIG.CACHE_MAX_ENTRIES,
});
export function obtenerObservacionesButaca({ pelicula, ciudad, desde, hasta }) {
  if (!butacaIntegration.estaHabilitadoButaca())
    return Promise.reject(butacaIntegration.crearErrorButacaDeshabilitado());
  return cache.getOrSet(
    `${pelicula.tmdbId}:${ciudad.id}:${desde}:${FUNCIONES_CINE_CONFIG.VERSION_MAPEOS}`,
    async () => {
      const { data: cines, consultadoEn } = await butacaIntegration.listarCinesButaca();
      const fechasConsulta = [consultadoEn];
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
              (fuente) =>
                fuente.fuenteId === FUENTE_ID_BUTACA && fuente.registroId === String(mapeo.id),
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
          const consultaPeliculas = await butacaIntegration.listarPeliculasButaca(cine.id);
          const peliculas = consultaPeliculas.data;
          fechasConsulta.push(consultaPeliculas.consultadoEn);
          const revisadas = peliculas.filter((item) =>
            corresponderPeliculaCine({
              fuenteId: FUENTE_ID_BUTACA,
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
              fuenteId: FUENTE_ID_BUTACA,
              registroId: item.corporateId,
              nombre: item.title,
              tmdbId: pelicula.tmdbId,
              correspondencias,
            }),
          );
          if (!candidatas.length) {
            const correspondenciasPelicula = correspondencias.filter(
              (item) => item.fuenteId === FUENTE_ID_BUTACA && item.tmdbId === pelicula.tmdbId,
            );
            const nombres = [
              ...(pelicula.identidadCine?.nombres ?? []),
              ...correspondenciasPelicula.map((item) => item.nombre),
            ].map(normalizarTextoCine);
            const identidadPendiente = peliculas.some(
              (item) =>
                nombres.includes(normalizarTextoCine(item.title)) ||
                correspondenciasPelicula.some(
                  (correspondencia) => correspondencia.registroId === item.corporateId,
                ),
            );
            if (identidadPendiente) estructuraPresente = false;
          }
          for (const candidata of candidatas) {
            const consultaHorarios = await butacaIntegration.listarFuncionesButaca({
              corporateId: candidata.corporateId,
              cineId: cine.id,
            });
            fechasConsulta.push(consultaHorarios.consultadoEn);
            const sesiones = consolidarSesionesButaca(consultaHorarios.data);
            if (sesiones.incompleta) estructuraPresente = false;
            for (const horario of sesiones.horarios) {
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
                fuenteId: FUENTE_ID_BUTACA,
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
        fuenteId: FUENTE_ID_BUTACA,
        registroId: null,
        nombre: 'Butaca / Cinemark',
        url: `${FUNCIONES_CINE_CONFIG.BUTACA_BASE_URL}/cinema/showtimes`,
        consultadoEn: fechasConsulta.sort()[0],
        actualizadoEn: null,
      };
      return {
        observaciones,
        ciudad,
        tmdbId: pelicula.tmdbId,
        desde,
        hasta,
        fuente,
        correspondencias,
        estructuraPresente,
      };
    },
  );
}
