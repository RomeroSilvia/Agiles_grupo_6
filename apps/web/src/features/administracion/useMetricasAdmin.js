import { useCallback } from 'react';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { obtenerMetricasAdmin } from './administracion.api.js';
import { MENSAJE_ERROR_METRICAS } from './administracion.constants.js';

export function useMetricasAdmin(periodo) {
  const solicitar = useCallback(
    ({ signal }) => obtenerMetricasAdmin({ periodo, signal }),
    [periodo],
  );

  return useRemoteData({
    clave: periodo,
    habilitado: true,
    solicitar,
    mensajeError: MENSAJE_ERROR_METRICAS,
  });
}
