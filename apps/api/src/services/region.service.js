import { REGION_SOURCE } from '@buscador/shared/constants';
import { env } from '../config/env.config.js';
import { DatabaseError, ExternalServiceError } from '../errors/index.js';
import * as geoipIntegration from '../integrations/geoip.integration.js';
import * as perfilRepository from '../repositories/perfil.repository.js';

async function tryOrWarn(operation, ExpectedError, message) {
  try {
    return await operation();
  } catch (error) {
    if (!(error instanceof ExpectedError)) {
      throw error;
    }
    console.warn(message, error);
    return null;
  }
}

export async function obtenerRegion({ usuarioId, ip }) {
  const regionDetectada = await tryOrWarn(
    () => geoipIntegration.getRegionByIp(ip),
    ExternalServiceError,
    'No se pudo detectar la región por IP',
  );

  if (regionDetectada) {
    if (usuarioId) {
      await tryOrWarn(
        () => perfilRepository.actualizarRegion(usuarioId, regionDetectada),
        DatabaseError,
        'No se pudo guardar la región del perfil',
      );
    }
    return { region: regionDetectada, source: REGION_SOURCE.IP };
  }

  if (usuarioId) {
    const regionGuardada = await tryOrWarn(
      () => perfilRepository.obtenerRegion(usuarioId),
      DatabaseError,
      'No se pudo consultar la región del perfil',
    );
    if (regionGuardada) {
      return { region: regionGuardada, source: REGION_SOURCE.PROFILE };
    }
  }

  return { region: env.DEFAULT_REGION, source: REGION_SOURCE.DEFAULT };
}
