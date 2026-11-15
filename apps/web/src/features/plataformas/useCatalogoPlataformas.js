import { useRemoteData } from '../../hooks/useRemoteData.js';
import { listarPlataformas } from './plataformas.api.js';
import { MENSAJE_ERROR_CATALOGO } from './plataformas.constants.js';

const SIN_PLATAFORMAS = Object.freeze([]);

export function useCatalogoPlataformas() {
  const { datos, isLoading, error, reintentar } = useRemoteData({
    clave: 'plataformas',
    habilitado: true,
    solicitar: listarPlataformas,
    mensajeError: MENSAJE_ERROR_CATALOGO,
  });

  return { plataformas: datos ?? SIN_PLATAFORMAS, loading: isLoading, error, reintentar };
}
