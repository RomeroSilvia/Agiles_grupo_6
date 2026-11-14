import {
  ESTADO_EXHIBICION,
  ESTADO_FECHA,
  FUENTE_ID_TMDB,
  REGION_CARTELERA,
} from '@buscador/shared/constants';
import { respuestaCarteleraSchema } from '@buscador/shared/schemas';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import {
  fechaEstrenoArgentinaSchema,
  respuestaTmdbCarteleraSchema,
} from '../models/cartelera.model.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

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
  const cartelera = validateExternalResponse(
    respuestaTmdbCarteleraSchema,
    await tmdbIntegration.listarPeliculasEnCartelera({ pagina }),
  );
  const peliculasUnicas = new Map(
    cartelera.resultados.map((pelicula) => [pelicula.tmdbId, pelicula]),
  );
  const resultados = await Promise.all(
    [...peliculasUnicas.values()].map(async (pelicula) => {
      const fechaEstreno = validateExternalResponse(
        fechaEstrenoArgentinaSchema,
        await tmdbIntegration.obtenerFechaEstrenoArgentina({ tmdbId: pelicula.tmdbId }),
      );

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

  return validateExternalResponse(respuestaCarteleraSchema, {
    region: REGION_CARTELERA,
    resultados,
    pagina,
    totalResultados: cartelera.totalResultados,
    totalPaginas: cartelera.totalPaginas,
    fuente: crearFuente({ consultadoEn: cartelera.consultadoEn }),
  });
}
