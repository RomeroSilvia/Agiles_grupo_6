import { env } from '../config/env.config.js';
import { ExternalServiceError } from '../errors/index.js';
import * as geoipIntegration from '../integrations/geoip.integration.js';
import * as perfilRepository from '../repositories/perfil.repository.js';

export async function obtenerRegion({ usuarioId, ip }) {
  if (usuarioId) {
    const regionGuardada = await perfilRepository.obtenerRegion(usuarioId);
    if (regionGuardada) {
      return { region: regionGuardada, source: 'profile' };
    }
  }

  let regionDetectada;
  try {
    regionDetectada = await geoipIntegration.getRegionByIp(ip);
  } catch (error) {
    if (!(error instanceof ExternalServiceError)) {
      throw error;
    }
  }

  if (!regionDetectada) {
    return { region: env.DEFAULT_REGION, source: 'default' };
  }

  if (usuarioId) {
    const regionGuardada = await perfilRepository.guardarRegionSiVacia(usuarioId, regionDetectada);
    if (!regionGuardada) {
      return { region: await perfilRepository.obtenerRegion(usuarioId), source: 'profile' };
    }
  }

  return { region: regionDetectada, source: 'ip' };
}
