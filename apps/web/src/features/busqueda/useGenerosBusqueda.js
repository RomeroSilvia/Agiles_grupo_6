import { useCallback, useState } from 'react';
import { listarGenerosBusqueda } from './busqueda.api.js';
import { useRemoteData } from '../../hooks/useRemoteData.js';

const MENSAJE_ERROR = 'No se pudieron cargar los géneros. Probá de nuevo más tarde.';

export function useGenerosBusqueda({ cargarInicialmente = false } = {}) {
  const [habilitado, setHabilitado] = useState(cargarInicialmente);
  const solicitar = useCallback(async ({ signal }) => {
    const generos = await listarGenerosBusqueda({ signal });
    if (!Array.isArray(generos)) {
      throw new Error('Respuesta de géneros inválida');
    }
    return generos;
  }, []);
  const respuesta = useRemoteData({
    clave: 'generos',
    habilitado,
    solicitar,
    mensajeError: MENSAJE_ERROR,
  });
  const cargar = useCallback(() => setHabilitado(true), []);

  return {
    generos: Array.isArray(respuesta.datos) ? respuesta.datos : [],
    isLoading: respuesta.isLoading,
    error: respuesta.error,
    cargado: respuesta.cargado,
    cargar,
    reintentar: respuesta.reintentar,
  };
}
