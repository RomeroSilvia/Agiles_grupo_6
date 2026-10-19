import { env } from '../config/env.config.js';
import { STREAMING_AVAILABILITY_CONFIG } from '../config/streamingAvailability.config.js';
import * as streamingAvailabilityIntegration from '../integrations/streamingAvailability.integration.js';
import * as disponibilidadRepository from '../repositories/disponibilidad.repository.js';
import * as fuenteDatosRepository from '../repositories/fuenteDatos.repository.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import * as sincronizacionRepository from '../repositories/sincronizacion.repository.js';
import * as watchlistRepository from '../repositories/watchlist.repository.js';

const FUENTE_DATOS = 'Streaming Availability';

function claveCombinacion({ tituloId, region }) {
  return String(tituloId) + ':' + region;
}

function deduplicarCombinaciones(combinaciones) {
  return [...new Map(combinaciones.map((item) => [claveCombinacion(item), item])).values()].sort(
    (a, b) => a.tituloId - b.tituloId || a.region.localeCompare(b.region),
  );
}

function claveOferta({ plataformaId, tipoOferta }) {
  return String(plataformaId) + ':' + tipoOferta;
}

function crearDeepLink(link) {
  if (typeof link !== 'string' || link.length > 500) {
    return null;
  }

  try {
    const url = new URL(link);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function mapearOfertas({
  ofertas,
  combinacion,
  plataformasPorProvider,
  fuenteId,
  existentes,
  ahora,
}) {
  const existentesPorClave = new Map(existentes.map((oferta) => [claveOferta(oferta), oferta]));
  const ofertasUnicas = new Map();

  for (const oferta of ofertas) {
    const tmdbProviderId =
      STREAMING_AVAILABILITY_CONFIG.TMDB_PROVIDER_ID_POR_SERVICIO[oferta.service.id];
    const tipoOferta = STREAMING_AVAILABILITY_CONFIG.TIPO_OFERTA_POR_TIPO[oferta.type];
    const plataforma = plataformasPorProvider.get(tmdbProviderId);
    const deepLink = crearDeepLink(oferta.link);

    if (!plataforma || !tipoOferta || !deepLink) {
      continue;
    }

    const clave = claveOferta({ plataformaId: plataforma.id, tipoOferta });
    if (ofertasUnicas.has(clave)) {
      continue;
    }

    const existente = existentesPorClave.get(clave);
    ofertasUnicas.set(clave, {
      tituloId: combinacion.tituloId,
      plataformaId: plataforma.id,
      region: combinacion.region,
      tipoOferta,
      deepLink,
      fuenteId,
      detectadaEn: existente?.vigente ? existente.detectadaEn : ahora,
      verificadaEn: ahora,
      vigente: true,
    });
  }

  return [...ofertasUnicas.values()];
}

function obtenerVentanaUtc(ahora) {
  const inicio = new Date(ahora);
  inicio.setUTCHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setUTCDate(fin.getUTCDate() + 1);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

function seleccionarLote(combinaciones, sincronizacionId, cupoDisponible) {
  const maximoPorLote = STREAMING_AVAILABILITY_CONFIG.MAX_REQUESTS_PER_DAY;
  const cantidadLotes = Math.ceil(combinaciones.length / maximoPorLote);
  const indiceLote = (Number(sincronizacionId) - 1) % cantidadLotes;
  const inicio = indiceLote * maximoPorLote;

  return combinaciones.slice(inicio, inicio + Math.min(maximoPorLote, cupoDisponible));
}

function formatearErrores(errores) {
  return errores.length > 0 ? errores.join('\n').slice(0, 8000) : null;
}

async function finalizarEjecucion(sincronizacionId, { ahora, errores }) {
  await sincronizacionRepository.finalizar(sincronizacionId, {
    finalizadaEn: ahora.toISOString(),
    error: formatearErrores(errores),
  });
}

async function procesarCombinacion({
  combinacion,
  plataformasPorProvider,
  fuenteId,
  ahora,
  errores,
}) {
  try {
    const ofertasExternas = await streamingAvailabilityIntegration.obtenerOfertas({
      tipo: combinacion.tipo,
      tmdbId: combinacion.tmdbId,
      region: combinacion.region,
    });
    const existentes = await disponibilidadRepository.listarPorTituloYRegion(
      combinacion.tituloId,
      combinacion.region,
    );
    const ofertasNuevas = mapearOfertas({
      ofertas: ofertasExternas,
      combinacion,
      plataformasPorProvider,
      fuenteId,
      existentes,
      ahora: ahora.toISOString(),
    });
    const clavesNuevas = new Set(ofertasNuevas.map(claveOferta));
    const ofertasSincronizadas = [
      ...ofertasNuevas,
      ...existentes
        .filter((existente) => !clavesNuevas.has(claveOferta(existente)))
        .map((existente) => ({
          ...existente,
          verificadaEn: ahora.toISOString(),
          vigente: false,
        })),
    ];

    if (ofertasSincronizadas.length > 0) {
      await disponibilidadRepository.guardarOfertas(ofertasSincronizadas);
    }
  } catch (error) {
    const detalle =
      error instanceof Error ? error.message : 'Error desconocido al consultar la disponibilidad';
    errores.push(
      combinacion.tipo + '/' + combinacion.tmdbId + ' (' + combinacion.region + '): ' + detalle,
    );
    console.warn('Falló la sincronización de disponibilidad para un título', {
      tituloId: combinacion.tituloId,
      region: combinacion.region,
      error: detalle,
    });
  }
}

export async function sincronizarDisponibilidad({ ahora = new Date() } = {}) {
  const sincronizacion = await sincronizacionRepository.iniciar();
  let procesados = 0;
  const errores = [];

  try {
    const watchlist = await watchlistRepository.listarTitulosConAvisosActivos(env.DEFAULT_REGION);
    const combinaciones = deduplicarCombinaciones(watchlist);

    if (combinaciones.length === 0) {
      await finalizarEjecucion(sincronizacion.id, { ahora, errores });
      return {
        sincronizacionId: sincronizacion.id,
        combinacionesProcesadas: procesados,
        combinacionesPendientes: 0,
        errores,
      };
    }

    if (!env.STREAMING_AVAILABILITY_API_KEY) {
      throw new Error('Falta configurar STREAMING_AVAILABILITY_API_KEY');
    }

    const [plataformas, fuenteId] = await Promise.all([
      plataformaRepository.listarActivas(),
      fuenteDatosRepository.obtenerIdPorNombre(FUENTE_DATOS),
    ]);
    const plataformasPorProvider = new Map(
      plataformas.map((plataforma) => [plataforma.tmdbProviderId, plataforma]),
    );

    if (plataformasPorProvider.size === 0) {
      throw new Error('No hay plataformas activas para guardar la disponibilidad');
    }

    const { inicio, fin } = obtenerVentanaUtc(sincronizacion.iniciadaEn ?? ahora);
    const lote = seleccionarLote(
      combinaciones,
      sincronizacion.id,
      STREAMING_AVAILABILITY_CONFIG.MAX_REQUESTS_PER_DAY,
    );
    let siguienteCombinacion = 0;
    let cupoAgotado = false;
    let errorFatal;

    async function procesarSiguienteCombinacion() {
      while (!cupoAgotado && !errorFatal && siguienteCombinacion < lote.length) {
        const combinacion = lote[siguienteCombinacion];
        siguienteCombinacion += 1;

        try {
          const reservado = await sincronizacionRepository.reservarConsultaDisponibilidad(
            sincronizacion.id,
            {
              inicio,
              fin,
              limite: STREAMING_AVAILABILITY_CONFIG.MAX_REQUESTS_PER_DAY,
            },
          );

          if (!reservado) {
            cupoAgotado = true;
            return;
          }

          procesados += 1;
          await procesarCombinacion({
            combinacion,
            plataformasPorProvider,
            fuenteId,
            ahora,
            errores,
          });
        } catch (error) {
          errorFatal = error;
          return;
        }
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(STREAMING_AVAILABILITY_CONFIG.MAX_CONCURRENT_REQUESTS, lote.length) },
        () => procesarSiguienteCombinacion(),
      ),
    );

    if (errorFatal) {
      throw errorFatal;
    }

    const pendientes = combinaciones.length - procesados;
    if (pendientes > 0) {
      errores.push(
        'Límite diario de ' +
          STREAMING_AVAILABILITY_CONFIG.MAX_REQUESTS_PER_DAY +
          ' consultas: quedan ' +
          pendientes +
          ' combinaciones pendientes.',
      );
    }

    await finalizarEjecucion(sincronizacion.id, { ahora, errores });
    return {
      sincronizacionId: sincronizacion.id,
      combinacionesProcesadas: procesados,
      combinacionesPendientes: pendientes,
      errores,
    };
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'Error desconocido';
    errores.push(detalle);
    try {
      await finalizarEjecucion(sincronizacion.id, { ahora, errores });
    } catch (errorAlRegistrar) {
      console.error('No se pudo registrar el resultado de la sincronización', errorAlRegistrar);
    }
    throw error;
  }
}
