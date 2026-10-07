import { FUENTE_REGION } from '@buscador/shared/constants';
import { env } from '../config/env.config.js';
import { ExternalServiceError } from '../errors/index.js';
import * as geoipIntegration from '../integrations/geoip.integration.js';
import * as perfilRepository from '../repositories/perfil.repository.js';

export async function obtenerRegion({ usuarioId, ip }) {
  if (usuarioId) {
    const regionGuardada = await perfilRepository.obtenerRegion(usuarioId);
    if (regionGuardada) {
      return { region: regionGuardada, source: FUENTE_REGION.PERFIL };
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
    return { region: env.DEFAULT_REGION, source: FUENTE_REGION.DEFAULT };
  }

  if (usuarioId) {
    const regionGuardada = await perfilRepository.guardarRegionSiVacia(usuarioId, regionDetectada);
    if (!regionGuardada) {
      const regionActual = await perfilRepository.obtenerRegion(usuarioId);
      if (regionActual) {
        return { region: regionActual, source: FUENTE_REGION.PERFIL };
      }
    }
  }

  return { region: regionDetectada, source: FUENTE_REGION.IP };
}
