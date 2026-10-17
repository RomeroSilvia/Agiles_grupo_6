import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/api.service.js';

export function useRemoteOptions({ clave, habilitado, solicitar, esperaMs = 0, mensajeError }) {
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState({
    clave: null,
    intento: -1,
    datos: null,
    cargado: false,
    isLoading: false,
    error: '',
  });

  useEffect(() => {
    if (!habilitado) {
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setRespuesta({
        clave,
        intento,
        datos: null,
        cargado: false,
        isLoading: true,
        error: '',
      });
      solicitar({ signal: controller.signal })
        .then((datos) => {
          if (!controller.signal.aborted) {
            setRespuesta({ clave, intento, datos, cargado: true, isLoading: false, error: '' });
          }
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            setRespuesta({
              clave,
              intento,
              datos: null,
              cargado: false,
              isLoading: false,
              error: error instanceof ApiError ? error.message : mensajeError,
            });
          }
        });
    }, esperaMs);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [clave, habilitado, intento, mensajeError, solicitar, esperaMs]);

  const respuestaActual = respuesta.clave === clave && respuesta.intento === intento;
  const reintentar = useCallback(() => setIntento((actual) => actual + 1), []);

  return {
    datos: respuestaActual ? respuesta.datos : null,
    cargado: respuestaActual && respuesta.cargado,
    isLoading: habilitado && (!respuestaActual || respuesta.isLoading),
    error: respuestaActual ? respuesta.error : '',
    reintentar,
  };
}
