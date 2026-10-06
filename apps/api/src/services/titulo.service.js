import { TIPO_TITULO } from '@buscador/shared/constants';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { ExternalServiceError } from '../errors/index.js';
import { tituloSchema } from '../models/titulo.model.js';
import { disponibilidadSchema } from '../models/disponibilidad.model.js';

function validarRespuesta(respuesta) {
  const resultado = tituloSchema.safeParse(respuesta);

  if (!resultado.success) {
    throw new ExternalServiceError('TMDB', resultado.error);
  }

  return resultado.data;
}

function obtenerFuncionDetalle(tipo) {
  if (tipo === TIPO_TITULO.PELICULA) {
    return tmdbIntegration.obtenerPelicula ?? tmdbIntegration.obtenerDetallePelicula;
  }

  if (tipo === TIPO_TITULO.SERIE) {
    return tmdbIntegration.obtenerSerie ?? tmdbIntegration.obtenerDetalleSerie;
  }

  throw new ExternalServiceError('TMDB', new Error('Tipo de título inválido'));
}

export async function obtenerDetalleTitulo({ tipo, tmdbId }) {
  const obtenerDetalle = obtenerFuncionDetalle(tipo);
  const respuesta = await obtenerDetalle(tmdbId);

  return validarRespuesta(respuesta);
}

export async function obtenerDisponibilidadTitulo({ tipo, tmdbId, region }) {
  const respuesta = await tmdbIntegration.obtenerDisponibilidad({ tipo, tmdbId, region });
  const resultado = disponibilidadSchema.safeParse(respuesta);

  if (!resultado.success) {
    throw new ExternalServiceError('TMDB', resultado.error);
  }

  return resultado.data;
}
