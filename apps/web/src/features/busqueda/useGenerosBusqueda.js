import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../services/api.service.js';
import { listarGenerosBusqueda } from './busqueda.api.js';

export function useGenerosBusqueda({ cargarInicialmente = false } = {}) {
  const [intento, setIntento] = useState(cargarInicialmente ? 1 : 0);
  const [respuesta, setRespuesta] = useState({
    intento: 0,
    generos: [],
    cargado: false,
    error: '',
  });
  const isLoading = intento > 0 && respuesta.intento !== intento;

  useEffect(() => {
    if (intento === 0) {
      return undefined;
    }

    const controller = new AbortController();

    listarGenerosBusqueda({ signal: controller.signal })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('Respuesta de géneros inválida');
        }
        setRespuesta({ intento, generos: data, cargado: true, error: '' });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setRespuesta({
            intento,
            generos: [],
            cargado: false,
            error:
              requestError instanceof ApiError
                ? requestError.message
                : 'No se pudieron cargar los géneros. Probá de nuevo más tarde.',
          });
        }
      });

    return () => controller.abort();
  }, [intento]);

  const cargar = useCallback(() => {
    if (!isLoading && !respuesta.cargado) {
      setIntento((actual) => actual + 1);
    }
  }, [isLoading, respuesta.cargado]);

  const reintentar = useCallback(() => {
    if (!isLoading) {
      setIntento((actual) => actual + 1);
    }
  }, [isLoading]);

  return {
    generos: respuesta.generos,
    isLoading,
    error: respuesta.error,
    cargado: respuesta.cargado,
    cargar,
    reintentar,
  };
}
