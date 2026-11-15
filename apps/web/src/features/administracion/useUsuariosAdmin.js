import { useCallback } from 'react';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { listarUsuariosAdmin } from './administracion.api.js';
import { MENSAJE_ERROR_USUARIOS } from './administracion.constants.js';

export function useUsuariosAdmin({ mail, region, estado, pagina }) {
  const solicitar = useCallback(
    ({ signal }) => listarUsuariosAdmin({ mail, region, estado, pagina, signal }),
    [mail, region, estado, pagina],
  );

  return useRemoteData({
    clave: JSON.stringify([mail, region, estado, pagina]),
    habilitado: true,
    solicitar,
    mensajeError: MENSAJE_ERROR_USUARIOS,
  });
}
