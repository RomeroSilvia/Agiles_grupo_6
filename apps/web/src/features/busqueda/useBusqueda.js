import { useCallback, useEffect, useReducer, useRef } from 'react';
import { ApiError } from '../../services/api.service.js';
import { buscarTitulos } from './busqueda.api.js';
import { MENSAJES_ERROR_FILTRO } from './busqueda.constants.js';
import {
  ACCIONES_BUSQUEDA,
  busquedaReducer,
  convertirFiltros,
  obtenerEstadoInicial,
  validarFiltros,
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
      const validacion = validarFiltros(filtrosConsulta, paginaConsulta);

      if (!validacion.success) {
        if (!acumular) {
          ultimaBusquedaRef.current = null;
        }
        dispatch({
          type: ACCIONES_BUSQUEDA.BUSQUEDA_INVALIDA,
          mensaje: obtenerMensajeValidacion(validacion.error),
          acumular,
        });
        return null;
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
          return data;
        }

        return null;
      } catch (requestError) {
        if (requestError.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        dispatch({
          type: ACCIONES_BUSQUEDA.BUSQUEDA_FALLIDA,
          mensaje: obtenerMensajeError(requestError, soloPropias),
          acumular,
        });
        return null;
      }
    },
    [],
  );

  const setFiltros = useCallback(
    (filtros) => dispatch({ type: ACCIONES_BUSQUEDA.FILTROS_ACTUALIZADOS, filtros }),
    [],
  );

  const buscar = useCallback(
    (filtrosConsulta, opciones) => ejecutarBusqueda(filtrosConsulta, opciones),
    [ejecutarBusqueda],
  );

  const buscarHastaPagina = useCallback(
    async (filtrosConsulta, paginaFinal) => {
      for (let paginaConsulta = 1; paginaConsulta <= paginaFinal; paginaConsulta += 1) {
        const data = await ejecutarBusqueda(filtrosConsulta, {
          pagina: paginaConsulta,
          acumular: paginaConsulta > 1,
        });

        if (!data || paginaConsulta >= (data.totalPaginas ?? paginaConsulta)) {
          return;
        }
      }
    },
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

  return {
    ...estado,
    setFiltros,
    buscar,
    buscarHastaPagina,
    buscarConFiltros,
    cargarMas,
    isLoading: isLoading || isLoadingMore,
  };
}
