import { useCallback, useEffect, useReducer, useRef } from 'react';
import { regionesComparacionSchema } from '@buscador/shared/schemas';
import { rutaDisponibilidad } from '../../app/rutas.js';
import { ApiError, request } from '../../services/api.service.js';

const ESTADO_INICIAL = {
  clave: null,
  regiones: [],
  regionesFallidas: [],
  error: null,
  consultado: false,
  isLoading: false,
};

function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'iniciar':
      return {
        ...(estado.clave === accion.clave ? estado : ESTADO_INICIAL),
        clave: accion.clave,
        error: null,
        isLoading: true,
      };
    case 'exito':
      return {
        clave: accion.clave,
        regiones: accion.regiones,
        regionesFallidas: accion.regionesFallidas,
        error: null,
        consultado: true,
        isLoading: false,
      };
    case 'error':
      return {
        ...(accion.conservarResultados && estado.clave === accion.clave ? estado : ESTADO_INICIAL),
        clave: accion.clave,
        error: accion.error,
        isLoading: false,
      };
    default:
      return estado;
  }
}

export function useComparacionRegiones({ tipo, tmdbId } = {}) {
  const tieneParametros = Boolean(tipo && tmdbId);
  const rutaBase = tieneParametros ? rutaDisponibilidad(tipo, tmdbId) : null;
  const [estado, dispatch] = useReducer(reducer, ESTADO_INICIAL);
  const abortControllerRef = useRef(null);
  const ultimaSeleccionRef = useRef([]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [rutaBase]);

  const ejecutarComparacion = useCallback(
    async (codigos) => {
      if (!rutaBase) {
        return;
      }

      const validacion = regionesComparacionSchema.safeParse(codigos);
      if (!validacion.success) {
        const mensaje =
          validacion.error.issues?.[0]?.message ?? 'Seleccioná regiones válidas para comparar.';
        dispatch({
          tipo: 'error',
          clave: rutaBase,
          error: mensaje,
          conservarResultados: true,
        });
        return;
      }

      ultimaSeleccionRef.current = validacion.data;
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      dispatch({ tipo: 'iniciar', clave: rutaBase });

      try {
        const query = encodeURIComponent(validacion.data.join(','));
        const data = await request(`${rutaBase}/comparacion?regiones=${query}`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        dispatch({
          tipo: 'exito',
          clave: rutaBase,
          regiones: Array.isArray(data?.regiones) ? data.regiones : [],
          regionesFallidas: Array.isArray(data?.regionesFallidas) ? data.regionesFallidas : [],
        });
      } catch (requestError) {
        if (requestError.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        dispatch({
          tipo: 'error',
          clave: rutaBase,
          error:
            requestError instanceof ApiError
              ? requestError.message
              : 'No se pudo comparar la disponibilidad entre regiones.',
          conservarResultados: false,
        });
      }
    },
    [rutaBase],
  );

  const reintentar = useCallback(() => {
    if (ultimaSeleccionRef.current.length > 0) {
      ejecutarComparacion(ultimaSeleccionRef.current);
    }
  }, [ejecutarComparacion]);

  const esActual = estado.clave === rutaBase;

  return {
    regiones: esActual ? estado.regiones : [],
    regionesFallidas: esActual ? estado.regionesFallidas : [],
    error: esActual ? estado.error : null,
    consultado: esActual ? estado.consultado : false,
    isLoading: esActual ? estado.isLoading : false,
    comparar: ejecutarComparacion,
    reintentar,
  };
}
