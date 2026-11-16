import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/api.service.js';

export function useRemoteData({ clave, habilitado, solicitar, esperaMs = 0, mensajeError }) {
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState({
    clave: null,
    intento: -1,
    datos: null,
    cargado: false,
    isLoading: false,
    error: '',
    codigoError: null,
  });

  useEffect(() => {
    if (!habilitado) {
      return undefined;
    }

    const controller = new AbortController();
    const consultar = () => {
      setRespuesta({
        clave,
        intento,
        datos: null,
        cargado: false,
        isLoading: true,
        error: '',
        codigoError: null,
      });
      solicitar({ signal: controller.signal })
        .then((datos) => {
          if (!controller.signal.aborted) {
            setRespuesta({
              clave,
              intento,
              datos,
              cargado: true,
              isLoading: false,
              error: '',
              codigoError: null,
            });
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
              codigoError: error instanceof ApiError ? error.code : null,
            });
          }
        });
    };
    const timeout = esperaMs > 0 ? window.setTimeout(consultar, esperaMs) : null;
    if (!timeout) {
      consultar();
    }

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
    codigoError: respuestaActual ? respuesta.codigoError : null,
    reintentar,
  };
}
