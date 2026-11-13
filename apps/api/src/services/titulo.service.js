import { DEFAULT_REGION } from '@buscador/shared/constants';
import { ExternalServiceError } from '../errors/index.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import {
  comparacionDisponibilidadSchema,
  disponibilidadSchema,
} from '../models/disponibilidad.model.js';
import { tituloSchema } from '../models/titulo.model.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';
import * as deepLinkService from './deepLink.service.js';
import * as plataformaService from './plataforma.service.js';

export async function obtenerDetalleTitulo({ tipo, tmdbId }) {
  const respuesta = await tmdbIntegration.obtenerDetalle(tipo, tmdbId);
  return validateExternalResponse(tituloSchema, respuesta);
}

function obtenerDatosDisponibilidad({ tipo, tmdbId }) {
  return Promise.all([
    tmdbIntegration.obtenerOfertas({ tipo, tmdbId }),
    plataformaRepository.listarActivas(),
  ]);
}

async function armarDisponibilidad({
  tipo,
  tmdbId,
  region,
  ofertasPorRegion,
  plataformasActivas,
  completarDeepLinks,
}) {
  const ofertasDeRegion = ofertasPorRegion[region] ?? { enlaceTmdb: null, ofertas: [] };
  const ofertas = await completarDeepLinks({
    tipo,
    tmdbId,
    region,
    ofertas: plataformaService.agruparPlataformasPorTipoOferta(
      ofertasDeRegion.ofertas,
      plataformasActivas,
    ),
  });

  return validateExternalResponse(disponibilidadSchema, {
    region,
    ofertas,
    enlaceTmdb: ofertasDeRegion.enlaceTmdb,
  });
}

export async function obtenerDisponibilidad({ tipo, tmdbId, region = DEFAULT_REGION }) {
  const codigoRegion = String(region).toUpperCase();
  const [ofertasPorRegion, plataformasActivas] = await obtenerDatosDisponibilidad({
    tipo,
    tmdbId,
  });

  return armarDisponibilidad({
    tipo,
    tmdbId,
    region: codigoRegion,
    ofertasPorRegion,
    plataformasActivas,
    completarDeepLinks: deepLinkService.agregarDeepLinks,
  });
}

export async function compararDisponibilidad({ tipo, tmdbId, regiones }) {
  const [ofertasPorRegion, plataformasActivas] = await obtenerDatosDisponibilidad({
    tipo,
    tmdbId,
  });

  const resultados = await Promise.allSettled(
    regiones.map((region) =>
      armarDisponibilidad({
        tipo,
        tmdbId,
        region,
        ofertasPorRegion,
        plataformasActivas,
        completarDeepLinks: deepLinkService.agregarDeepLinksGuardados,
      }),
    ),
  );

  const regionesConfirmadas = [];
  const regionesFallidas = [];

  resultados.forEach((resultado, indice) => {
    if (resultado.status === 'fulfilled') {
      regionesConfirmadas.push(resultado.value);
    } else {
      regionesFallidas.push(regiones[indice]);
    }
  });

  if (regionesConfirmadas.length === 0) {
    throw new ExternalServiceError(
      'TMDB',
      new Error('No se pudo consultar la disponibilidad en las regiones solicitadas'),
    );
  }

  return validateExternalResponse(comparacionDisponibilidadSchema, {
    regiones: regionesConfirmadas,
    regionesFallidas,
  });
}
