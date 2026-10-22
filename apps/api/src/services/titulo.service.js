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

export async function obtenerDisponibilidad({ tipo, tmdbId, region = DEFAULT_REGION }) {
  const codigoRegion = String(region).toUpperCase();
  const [ofertas, plataformasActivas] = await Promise.all([
    tmdbIntegration.obtenerOfertas({ tipo, tmdbId }),
    plataformaRepository.listarActivas(),
  ]);

  const ofertasDeRegion = ofertas[codigoRegion] ?? { enlaceTmdb: null, ofertas: [] };
  const ofertasConDeepLinks = await deepLinkService.agregarDeepLinks({
    tipo,
    tmdbId,
    region: codigoRegion,
    ofertas: plataformaService.agruparPlataformasPorTipoOferta(
      ofertasDeRegion.ofertas,
      plataformasActivas,
    ),
  });

  return validateExternalResponse(disponibilidadSchema, {
    region: codigoRegion,
    ofertas: ofertasConDeepLinks,
    enlaceTmdb: ofertasDeRegion.enlaceTmdb,
  });
}

function armarDisponibilidadDeRegion({ codigoRegion, ofertasPorRegion, plataformasActivas }) {
  const datosRegion = ofertasPorRegion?.[codigoRegion];
  if (datosRegion instanceof Error) {
    throw datosRegion;
  }
  if (
    datosRegion !== undefined &&
    (!datosRegion || typeof datosRegion !== 'object' || !Array.isArray(datosRegion.ofertas))
  ) {
    throw new ExternalServiceError(
      'TMDB',
      new Error(`Datos de disponibilidad inválidos para la región ${codigoRegion}`),
    );
  }

  const regionData = datosRegion ?? { enlaceTmdb: null, ofertas: [] };
  const ofertasAgrupadas = plataformaService
    .agruparPlataformasPorTipoOferta(regionData.ofertas, plataformasActivas)
    .map(({ tipoOferta, plataformas }) => ({
      tipoOferta,
      plataformas: plataformas.map((plataforma) => ({
        ...plataforma,
        deepLink: plataforma.deepLink ?? null,
      })),
    }));

  return validateExternalResponse(disponibilidadSchema, {
    region: codigoRegion,
    ofertas: ofertasAgrupadas,
    enlaceTmdb: regionData.enlaceTmdb,
  });
}

export async function compararDisponibilidad({ tipo, tmdbId, regiones }) {
  const codigosUnicos = [...new Set(regiones.map((region) => String(region).toUpperCase()))];
  const [ofertasPorRegion, plataformasActivas] = await Promise.all([
    tmdbIntegration.obtenerOfertas({ tipo, tmdbId }),
    plataformaRepository.listarActivas(),
  ]);

  const resultados = await Promise.allSettled(
    codigosUnicos.map(async (codigoRegion) =>
      armarDisponibilidadDeRegion({
        codigoRegion,
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
      regionesFallidas.push(codigosUnicos[indice]);
    }
  });

  if (codigosUnicos.length > 0 && regionesConfirmadas.length === 0) {
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
