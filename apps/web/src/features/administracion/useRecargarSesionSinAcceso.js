import { useEffect } from 'react';
import { useSession } from '../../contexts/session/SessionContext.js';
import { API_ERROR_CODES } from '../../services/api.service.js';

const CODIGOS_SIN_ACCESO = new Set([API_ERROR_CODES.FORBIDDEN, API_ERROR_CODES.UNAUTHENTICATED]);

export function useRecargarSesionSinAcceso(codigoError) {
  const { reloadSession } = useSession();
  const sinAcceso = CODIGOS_SIN_ACCESO.has(codigoError);

  useEffect(() => {
    if (sinAcceso) {
      reloadSession();
    }
  }, [sinAcceso, reloadSession]);

  return sinAcceso;
}
