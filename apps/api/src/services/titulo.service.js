import { DEFAULT_REGION, TIPO_TITULO } from '@buscador/shared/constants';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import { ExternalServiceError } from '../errors/index.js';
import { disponibilidadSchema } from '../models/disponibilidad.model.js';
import { tituloSchema } from '../models/titulo.model.js';
import * as plataformaService from './plataforma.service.js';

function validarRespuesta(schema, respuesta) {
  const resultado = schema.safeParse(respuesta);

  if (!resultado.success) {
    throw new ExternalServiceError('TMDB', resultado.error);
  }

  return resultado.data;
}

function obtenerFuncionDetalle(tipo) {
  if (tipo === TIPO_TITULO.PELICULA) {
    return tmdbIntegration.obtenerPelicula;
  }

  if (tipo === TIPO_TITULO.SERIE) {
    return tmdbIntegration.obtenerSerie;
  }

  throw new ExternalServiceError('TMDB', new Error('Tipo de título inválido'));
}

export async function obtenerDetalleTitulo({ tipo, tmdbId }) {
  const obtenerDetalle = obtenerFuncionDetalle(tipo);
  const respuesta = await obtenerDetalle(tmdbId);

  return validarRespuesta(tituloSchema, respuesta);
}

export async function obtenerDisponibilidad({ tipo, tmdbId, region = DEFAULT_REGION }) {
  const codigoRegion = String(region).toUpperCase();
  const [ofertas, plataformasActivas] = await Promise.all([
    tmdbIntegration.obtenerOfertas({ tipo, tmdbId }),
    plataformaRepository.listarActivas(),
  ]);

  const ofertasDeRegion = ofertas[codigoRegion] ?? { enlaceTmdb: null, ofertas: [] };

  return validarRespuesta(disponibilidadSchema, {
    region: codigoRegion,
    ofertas: plataformaService.agruparPlataformasPorTipoOferta(
      ofertasDeRegion.ofertas,
      plataformasActivas,
    ),
    enlaceTmdb: ofertasDeRegion.enlaceTmdb,
  });
}
