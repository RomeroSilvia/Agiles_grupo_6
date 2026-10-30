import {
  CODIGOS_REGION_SOPORTADOS,
  DEFAULT_REGION,
  MAX_REGIONES_ALTERNATIVAS,
} from '@buscador/shared/constants';
import { ExternalServiceError } from '../errors/index.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import {
  comparacionDisponibilidadSchema,
  disponibilidadSchema,
  regionesAlternativasSchema,
} from '../models/disponibilidad.model.js';
import { tituloSchema } from '../models/titulo.model.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';
import * as deepLinkService from './deepLink.service.js';
import * as plataformaService from './plataforma.service.js';

export async function obtenerDetalleTitulo({ tipo, tmdbId }) {
  const respuesta = await tmdbIntegration.obtenerDetalle(tipo, tmdbId);
  return validateExternalResponse(tituloSchema, respuesta);
}

async function armarDisponibilidad({ tipo, tmdbId, region, ofertasPorRegion, plataformasActivas }) {
  const ofertasDeRegion = ofertasPorRegion[region] ?? { enlaceTmdb: null, ofertas: [] };
  const ofertas = await deepLinkService.agregarDeepLinks({
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
  const [ofertasPorRegion, plataformasActivas] = await Promise.all([
    tmdbIntegration.obtenerOfertas({ tipo, tmdbId }),
    plataformaRepository.listarActivas(),
  ]);

  return armarDisponibilidad({
    tipo,
    tmdbId,
    region: codigoRegion,
    ofertasPorRegion,
    plataformasActivas,
  });
}

export async function compararDisponibilidad({ tipo, tmdbId, regiones }) {
  const [ofertasPorRegion, plataformasActivas] = await Promise.all([
    tmdbIntegration.obtenerOfertas({ tipo, tmdbId }),
    plataformaRepository.listarActivas(),
  ]);

  const resultados = await Promise.allSettled(
    regiones.map((region) =>
      armarDisponibilidad({
        tipo,
        tmdbId,
        region,
        ofertasPorRegion,
        plataformasActivas,
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

export async function obtenerRegionesAlternativas({ tipo, tmdbId, region = DEFAULT_REGION }) {
  const codigoRegion = String(region).toUpperCase();
  const [ofertasPorRegion, plataformasActivas] = await Promise.all([
    tmdbIntegration.obtenerOfertas({ tipo, tmdbId }),
    plataformaRepository.listarActivas(),
  ]);

  const disponibilidadActual = await armarDisponibilidad({
    tipo,
    tmdbId,
    region: codigoRegion,
    ofertasPorRegion,
    plataformasActivas,
  });

  if (disponibilidadActual.ofertas.length > 0) {
    return validateExternalResponse(regionesAlternativasSchema, {
      region: codigoRegion,
      disponibleEnRegionActual: true,
      alternativas: [],
    });
  }

  const regionesCandidatas = CODIGOS_REGION_SOPORTADOS.filter((codigo) => codigo !== codigoRegion);
  const comparacion = await compararDisponibilidad({
    tipo,
    tmdbId,
    regiones: regionesCandidatas,
  });

  const alternativas = comparacion.regiones
    .filter(({ ofertas }) => ofertas.length > 0)
    .slice(0, MAX_REGIONES_ALTERNATIVAS);

  if (alternativas.length === 0 && comparacion.regionesFallidas.length > 0) {
    throw new ExternalServiceError(
      'TMDB',
      new Error('No se pudo confirmar la disponibilidad en regiones alternativas'),
    );
  }

  return validateExternalResponse(regionesAlternativasSchema, {
    region: codigoRegion,
    disponibleEnRegionActual: false,
    alternativas,
  });
}
