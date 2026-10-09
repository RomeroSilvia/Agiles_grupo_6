import { REGION_SOURCE } from '@buscador/shared/constants';
import { env } from '../config/env.config.js';
import { DatabaseError, ExternalServiceError } from '../errors/index.js';
import * as geoipIntegration from '../integrations/geoip.integration.js';
import * as perfilRepository from '../repositories/perfil.repository.js';

async function obtenerRegionGuardada(usuarioId) {
  try {
    return await perfilRepository.obtenerRegion(usuarioId);
  } catch (error) {
    if (!(error instanceof DatabaseError)) {
      throw error;
    }
    console.warn('No se pudo consultar la región del perfil', error);
    return null;
  }
}

async function guardarRegionDetectada(usuarioId, region) {
  try {
    return await perfilRepository.guardarRegionSiVacia(usuarioId, region);
  } catch (error) {
    if (!(error instanceof DatabaseError)) {
      throw error;
    }
    console.warn('No se pudo guardar la región del perfil', error);
    return null;
  }
}

export async function obtenerRegion({ usuarioId, ip }) {
  if (usuarioId) {
    const regionGuardada = await obtenerRegionGuardada(usuarioId);
    if (regionGuardada) {
      return { region: regionGuardada, source: REGION_SOURCE.PROFILE };
    }
  }

  let regionDetectada;
  try {
    regionDetectada = await geoipIntegration.getRegionByIp(ip);
  } catch (error) {
    if (!(error instanceof ExternalServiceError)) {
      throw error;
    }
    console.warn('No se pudo detectar la región por IP', error);
  }

  if (!regionDetectada) {
    return { region: env.DEFAULT_REGION, source: REGION_SOURCE.DEFAULT };
  }

  if (usuarioId) {
    const regionGuardada = await guardarRegionDetectada(usuarioId, regionDetectada);
    if (!regionGuardada) {
      const regionActual = await obtenerRegionGuardada(usuarioId);
      if (regionActual) {
        return { region: regionActual, source: REGION_SOURCE.PROFILE };
      }
    }
  }

  return { region: regionDetectada, source: REGION_SOURCE.IP };
}
