import { DEFAULT_REGION, TIPO_OFERTA, TIPO_TITULO } from '@buscador/shared/constants';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import { ExternalServiceError } from '../errors/index.js';
import { tituloSchema } from '../models/titulo.model.js';

const CLAVES_OFERTAS_STREAMING = Object.freeze({
  flatrate: TIPO_OFERTA.SUSCRIPCION,
  free: TIPO_OFERTA.GRATIS,
  ads: TIPO_OFERTA.CON_ANUNCIOS,
});

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

export async function obtenerDisponibilidad({ tipo, tmdbId, region = DEFAULT_REGION }) {
  const codigoRegion = String(region).toUpperCase();
  const [proveedoresPorRegion, plataformasActivas] = await Promise.all([
    tmdbIntegration.obtenerProveedores(tipo, tmdbId),
    plataformaRepository.listarActivas(),
  ]);

  const datosRegion = proveedoresPorRegion?.[codigoRegion];
  if (!datosRegion || typeof datosRegion !== 'object') {
    return {
      region: codigoRegion,
      plataformas: [],
    };
  }

  const proveedoresMap = new Map();
  for (const [claveTmdb, tipoOferta] of Object.entries(CLAVES_OFERTAS_STREAMING)) {
    const lista = Array.isArray(datosRegion[claveTmdb]) ? datosRegion[claveTmdb] : [];
    for (const item of lista) {
      if (Number.isInteger(item?.provider_id) && !proveedoresMap.has(item.provider_id)) {
        proveedoresMap.set(item.provider_id, {
          logoPath: item.logo_path ?? null,
          tipoOferta,
        });
      }
    }
  }

  const plataformasDisponibles = [];
  for (const plataforma of plataformasActivas) {
    const proveedorTmdb = proveedoresMap.get(plataforma.tmdbProviderId);
    if (proveedorTmdb) {
      plataformasDisponibles.push({
        id: plataforma.id,
        tmdbProviderId: plataforma.tmdbProviderId,
        nombre: plataforma.nombre,
        logoPath: plataforma.logoPath ?? proveedorTmdb.logoPath,
        urlHome: plataforma.urlHome,
      });
    }
  }

  return {
    region: codigoRegion,
    plataformas: plataformasDisponibles,
  };
}
