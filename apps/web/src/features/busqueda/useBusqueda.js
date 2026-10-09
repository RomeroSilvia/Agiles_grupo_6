import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { busquedaSchema } from '@buscador/shared/schemas';
import { ApiError } from '../../services/api.service.js';
import { buscarTitulos } from './busqueda.api.js';
import { MENSAJES_ERROR_FILTRO } from './busqueda.constants.js';
import {
  ACCIONES_BUSQUEDA,
  busquedaReducer,
  convertirFiltros,
  obtenerEstadoInicial,
  prepararFiltros,
} from './busquedaReducer.js';

function obtenerMensajeValidacion(error) {
  return error.issues[0]?.message ?? 'Revisá los datos ingresados';
}

function obtenerMensajeError(error, soloPropias) {
  if (soloPropias) {
    return MENSAJES_ERROR_FILTRO[error?.code] ?? MENSAJES_ERROR_FILTRO.POR_DEFECTO;
  }

  return error instanceof ApiError ? error.message : 'No se pudo completar la búsqueda';
}

export function useBusqueda(estadoGuardado) {
  const [estado, dispatch] = useReducer(busquedaReducer, estadoGuardado, obtenerEstadoInicial);
  const abortControllerRef = useRef(null);
  const ultimaBusquedaRef = useRef(estado.ultimaBusqueda);

  const ejecutarBusqueda = useCallback(
    async (filtrosConsulta, { pagina: paginaConsulta = 1, acumular = false } = {}) => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const validacion = busquedaSchema.safeParse(prepararFiltros(filtrosConsulta, paginaConsulta));

      if (!validacion.success) {
        if (!acumular) {
          ultimaBusquedaRef.current = null;
        }
        dispatch({
          type: ACCIONES_BUSQUEDA.BUSQUEDA_INVALIDA,
          mensaje: obtenerMensajeValidacion(validacion.error),
          acumular,
        });
        return;
      }

      const filtrosValidos = validacion.data;
      const soloPropias = Boolean(filtrosConsulta.soloPropias);
      const ultimaBusqueda = {
        ...convertirFiltros(filtrosValidos),
        soloPropias,
        firmaPlataformas: soloPropias ? (filtrosConsulta.firmaPlataformas ?? null) : null,
      };
      ultimaBusquedaRef.current = ultimaBusqueda;
      dispatch({ type: ACCIONES_BUSQUEDA.BUSQUEDA_INICIADA, ultimaBusqueda, acumular });

      try {
        const data = await buscarTitulos(filtrosValidos, {
          soloPropias,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          dispatch({ type: ACCIONES_BUSQUEDA.BUSQUEDA_EXITOSA, data, acumular });
        }
      } catch (requestError) {
        if (requestError.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        dispatch({
          type: ACCIONES_BUSQUEDA.BUSQUEDA_FALLIDA,
          mensaje: obtenerMensajeError(requestError, soloPropias),
          acumular,
        });
      }
    },
    [],
  );

  const setFiltros = useCallback(
    (filtros) => dispatch({ type: ACCIONES_BUSQUEDA.FILTROS_ACTUALIZADOS, filtros }),
    [],
  );

  const buscar = useCallback(
    (filtrosConsulta) => ejecutarBusqueda(filtrosConsulta),
    [ejecutarBusqueda],
  );

  const buscarConFiltros = useCallback(
    (filtrosConsulta) =>
      ejecutarBusqueda({
        ...filtrosConsulta,
        q: ultimaBusquedaRef.current?.q ?? '',
      }),
    [ejecutarBusqueda],
  );

  const { pagina, totalPaginas, isLoading, isLoadingMore } = estado;

  const cargarMas = useCallback(() => {
    if (!ultimaBusquedaRef.current || isLoading || isLoadingMore || pagina >= totalPaginas) {
      return;
    }

    return ejecutarBusqueda(ultimaBusquedaRef.current, {
      pagina: pagina + 1,
      acumular: true,
    });
  }, [ejecutarBusqueda, isLoading, isLoadingMore, pagina, totalPaginas]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const {
    filtros,
    resultados,
    totalResultados,
    verificacionIncompleta,
    hasSearched,
    ultimaBusqueda,
  } = estado;

  const estadoGuardable = useMemo(
    () => ({
      filtros,
      resultados,
      pagina,
      totalResultados,
      totalPaginas,
      verificacionIncompleta,
      hasSearched,
      ultimaBusqueda,
    }),
    [
      filtros,
      resultados,
      pagina,
      totalResultados,
      totalPaginas,
      verificacionIncompleta,
      hasSearched,
      ultimaBusqueda,
    ],
  );

  return {
    ...estado,
    setFiltros,
    buscar,
    buscarConFiltros,
    cargarMas,
    isLoading: isLoading || isLoadingMore,
    estadoGuardable,
  };
}
