import { useCallback } from 'react';
import { useRemoteOptions } from '../../hooks/useRemoteOptions.js';
import { listarUsuariosAdmin } from './administracion.api.js';
import { DEBOUNCE_BUSQUEDA_MAIL_MS, MENSAJE_ERROR_USUARIOS } from './administracion.constants.js';

export function useUsuariosAdmin({ mail, region, estado, pagina }) {
  const solicitar = useCallback(
    ({ signal }) => listarUsuariosAdmin({ mail, region, estado, pagina, signal }),
    [mail, region, estado, pagina],
  );

  return useRemoteOptions({
    clave: JSON.stringify([mail, region, estado, pagina]),
    habilitado: true,
    solicitar,
    esperaMs: DEBOUNCE_BUSQUEDA_MAIL_MS,
    mensajeError: MENSAJE_ERROR_USUARIOS,
  });
}
