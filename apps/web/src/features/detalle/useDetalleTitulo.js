import { useCallback } from 'react';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { obtenerDetalleTitulo } from './detalle.api.js';

const MENSAJE_ERROR = 'No se pudo cargar el detalle del título.';
const MENSAJE_SIN_PARAMETROS = 'No se pudo identificar el título.';

export function useDetalleTitulo({ tipo, tmdbId } = {}) {
  const tieneParametros = Boolean(tipo && tmdbId);
  const solicitar = useCallback(
    ({ signal }) => obtenerDetalleTitulo({ tipo, tmdbId, signal }),
    [tipo, tmdbId],
  );
  const { datos, isLoading, error, codigoError } = useRemoteData({
    clave: tieneParametros ? `${tipo}/${tmdbId}` : null,
    habilitado: tieneParametros,
    solicitar,
    mensajeError: MENSAJE_ERROR,
  });

  return {
    titulo: datos,
    isLoading,
    error: tieneParametros ? error || null : MENSAJE_SIN_PARAMETROS,
    errorCode: codigoError,
  };
}
