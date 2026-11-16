import {
  ESTADO_EXHIBICION,
  ESTADO_FECHA,
  FUENTE_ID_TMDB,
  REGION_CARTELERA,
} from '@buscador/shared/constants';
import { respuestaCarteleraSchema, respuestaEstrenosSchema } from '@buscador/shared/schemas';
import { obtenerHoyArgentina, sumarDiasCivil } from '@buscador/shared/utils';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { ExternalServiceError } from '../errors/index.js';
import { ESTRENOS_CONFIG } from '../config/tmdb.config.js';
import { createTtlCache } from '../utils/ttlCache.js';

const estrenosCache = createTtlCache({
  ttlMs: ESTRENOS_CONFIG.CACHE_TTL_MS,
  maxEntries: ESTRENOS_CONFIG.CACHE_MAX_ENTRIES,
});

export async function listarProximosEstrenos({ desde, hasta, pagina }) {
  const conjunto = await estrenosCache.getOrSet(
    `${REGION_CARTELERA}:${desde}:${hasta}`,
    async () => {
      const candidatos = new Map();
      let paginasLeidas = 0;
      for (const origen of ['upcoming', 'discover']) {
        let totalPaginas = 1;
        for (let paginaFuente = 1; paginaFuente <= totalPaginas; paginaFuente += 1) {
          if (++paginasLeidas > ESTRENOS_CONFIG.MAX_PAGINAS_FUENTE) {
            throw new ExternalServiceError(
              `los estrenos: se superó el límite de ${ESTRENOS_CONFIG.MAX_PAGINAS_FUENTE} páginas; probá otro período`,
            );
          }
          const respuesta = await tmdbIntegration.listarCandidatosEstrenos({
            origen,
            desde,
            hasta,
            pagina: paginaFuente,
          });
          if (
            respuesta.pagina !== paginaFuente ||
            (respuesta.totalPaginas > paginaFuente && !respuesta.resultados.length)
          ) {
            throw new ExternalServiceError(
              'los estrenos: la fuente devolvió una página incompleta',
            );
          }
          totalPaginas = respuesta.totalPaginas;
          for (const pelicula of respuesta.resultados) candidatos.set(pelicula.tmdbId, pelicula);
          if (
            candidatos.size > ESTRENOS_CONFIG.MAX_CANDIDATOS ||
            paginasLeidas + Math.max(0, totalPaginas - paginaFuente) >
              ESTRENOS_CONFIG.MAX_PAGINAS_FUENTE
          ) {
            throw new ExternalServiceError('los estrenos: se superó el presupuesto de consulta');
          }
        }
      }
      const resultados = (
        await Promise.all(
          [...candidatos.values()].map(async (pelicula) => {
            const { fechas, consultadoEn, anio } =
              await tmdbIntegration.obtenerFechasEstrenoArgentina({
                tmdbId: pelicula.tmdbId,
              });
            const fechaEstrenoAr = fechas
              .filter((fecha) => fecha >= desde && fecha <= hasta)
              .sort()[0];
            if (!fechaEstrenoAr) return null;
            return {
              ...pelicula,
              anio,
              region: REGION_CARTELERA,
              estadoExhibicion: ESTADO_EXHIBICION.PROXIMO_ESTRENO,
              fechaEstrenoAr,
              estadoFecha: ESTADO_FECHA.INFORMADA,
              fuente: crearFuente({ registroId: String(pelicula.tmdbId), consultadoEn }),
            };
          }),
        )
      )
        .filter(Boolean)
        .sort((a, b) => a.fechaEstrenoAr.localeCompare(b.fechaEstrenoAr) || a.tmdbId - b.tmdbId);
      return { resultados, fuente: crearFuente({ consultadoEn: new Date().toISOString() }) };
    },
  );
  return respuestaEstrenosSchema.parse({
    region: REGION_CARTELERA,
    desde,
    hasta,
    pagina,
    resultados: conjunto.resultados.slice(
      (pagina - 1) * ESTRENOS_CONFIG.RESULTADOS_POR_PAGINA,
      pagina * ESTRENOS_CONFIG.RESULTADOS_POR_PAGINA,
    ),
    totalResultados: conjunto.resultados.length,
    totalPaginas: Math.ceil(conjunto.resultados.length / ESTRENOS_CONFIG.RESULTADOS_POR_PAGINA),
    fuente: conjunto.fuente,
  });
}

function crearFuente({ registroId = null, consultadoEn }) {
  return {
    fuenteId: FUENTE_ID_TMDB,
    registroId,
    url: null,
    consultadoEn,
    actualizadoEn: null,
  };
}

export async function listarPeliculasEnCartelera({ pagina }) {
  const cartelera = await tmdbIntegration.listarPeliculasEnCartelera({ pagina });
  const peliculasUnicas = new Map(
    cartelera.resultados.map((pelicula) => [pelicula.tmdbId, pelicula]),
  );
  const resultados = await Promise.all(
    [...peliculasUnicas.values()].map(async (pelicula) => {
      const fechaEstreno = await tmdbIntegration.obtenerFechaEstrenoArgentina({
        tmdbId: pelicula.tmdbId,
      });

      return {
        ...pelicula,
        region: REGION_CARTELERA,
        estadoExhibicion: ESTADO_EXHIBICION.CARTELERA_PROVEEDOR,
        fechaEstrenoAr: fechaEstreno.fechaEstrenoAr,
        estadoFecha: fechaEstreno.fechaEstrenoAr ? ESTADO_FECHA.INFORMADA : ESTADO_FECHA.PENDIENTE,
        fuente: crearFuente({
          registroId: String(pelicula.tmdbId),
          consultadoEn: fechaEstreno.consultadoEn,
        }),
      };
    }),
  );

  return respuestaCarteleraSchema.parse({
    region: REGION_CARTELERA,
    resultados,
    pagina,
    totalResultados: cartelera.totalResultados,
    totalPaginas: cartelera.totalPaginas,
    fuente: crearFuente({ consultadoEn: cartelera.consultadoEn }),
  });
}

export async function obtenerExhibicionPelicula({ tmdbId }) {
  const hoy = obtenerHoyArgentina();
  const cartelera = await tmdbIntegration.listarIdsPeliculasEnCartelera();
  if (cartelera.includes(tmdbId)) return { consultable: true };
  const { fechas } = await tmdbIntegration.obtenerFechasEstrenoArgentina({ tmdbId });
  return {
    consultable: fechas.some(
      (fecha) => fecha > hoy && fecha <= sumarDiasCivil(hoy, ESTRENOS_CONFIG.HORIZONTE_DIAS),
    ),
  };
}
