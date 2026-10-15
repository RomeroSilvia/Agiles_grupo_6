import { DEFAULT_REGION } from '@buscador/shared/constants';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import { disponibilidadSchema } from '../models/disponibilidad.model.js';
import { tituloSchema } from '../models/titulo.model.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';
import * as plataformaService from './plataforma.service.js';

export async function obtenerDetalleTitulo({ tipo, tmdbId }) {
  const respuesta = await tmdbIntegration.obtenerDetalle(tipo, tmdbId);
  return validateExternalResponse(tituloSchema, respuesta);
}

export async function obtenerDisponibilidad({ tipo, tmdbId, region = DEFAULT_REGION }) {
  const codigoRegion = String(region).toUpperCase();
  const [ofertas, plataformasActivas] = await Promise.all([
    tmdbIntegration.obtenerOfertas({ tipo, tmdbId }),
    plataformaRepository.listarActivas(),
  ]);

  const ofertasDeRegion = ofertas[codigoRegion] ?? { enlaceTmdb: null, ofertas: [] };

  return validateExternalResponse(disponibilidadSchema, {
    region: codigoRegion,
    ofertas: plataformaService.agruparPlataformasPorTipoOferta(
      ofertasDeRegion.ofertas,
      plataformasActivas,
    ),
    enlaceTmdb: ofertasDeRegion.enlaceTmdb,
  });
}
