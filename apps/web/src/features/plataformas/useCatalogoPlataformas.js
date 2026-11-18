import { useMemo } from 'react';
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

  const plataformas = datos ?? SIN_PLATAFORMAS;
  const plataformasPorId = useMemo(
    () => new Map(plataformas.map((plataforma) => [plataforma.id, plataforma])),
    [plataformas],
  );

  return { plataformas, plataformasPorId, loading: isLoading, error, reintentar };
}
