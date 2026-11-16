import { useCallback } from 'react';
import { httpUrlSchema } from '@buscador/shared/schemas';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { obtenerDisponibilidad } from './detalle.api.js';

const MENSAJE_ERROR = 'No se pudo consultar la disponibilidad.';
const MENSAJE_SIN_PARAMETROS = 'No se pudo identificar el título.';

function normalizarDisponibilidad(data) {
  return {
    ofertas: Array.isArray(data?.ofertas) ? data.ofertas : [],
    enlaceTmdb: httpUrlSchema.safeParse(data?.enlaceTmdb).success ? data.enlaceTmdb : null,
  };
}

export function useDisponibilidad({ tipo, tmdbId, region, regionLoading = false } = {}) {
  const tieneParametros = Boolean(tipo && tmdbId);
  const regionResuelta = Boolean(region) && !regionLoading;
  const solicitar = useCallback(
    ({ signal }) =>
      obtenerDisponibilidad({ tipo, tmdbId, region, signal }).then(normalizarDisponibilidad),
    [tipo, tmdbId, region],
  );
  const { datos, isLoading, error, reintentar } = useRemoteData({
    clave: tieneParametros ? `${tipo}/${tmdbId}/${region ?? ''}` : null,
    habilitado: tieneParametros && regionResuelta,
    solicitar,
    mensajeError: MENSAJE_ERROR,
  });

  return {
    ofertas: datos?.ofertas ?? [],
    enlaceTmdb: datos?.enlaceTmdb ?? null,
    isLoading: tieneParametros && (!regionResuelta || isLoading),
    error: tieneParametros ? error || null : MENSAJE_SIN_PARAMETROS,
    reintentar,
  };
}
