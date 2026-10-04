import { useCallback, useEffect, useRef, useState } from 'react';
import { busquedaSchema } from '@buscador/shared/schemas';
import { request, ApiError } from '../services/api.service.js';

const FILTROS_INICIALES = {
  q: '',
  tipo: '',
  anio: '',
};

function obtenerEstadoInicial(estadoGuardado) {
  if (!estadoGuardado || typeof estadoGuardado !== 'object') {
    return {
      filtros: FILTROS_INICIALES,
      resultados: [],
      pagina: 1,
      totalResultados: 0,
      totalPaginas: 0,
      hasSearched: false,
      ultimaBusqueda: null,
    };
  }

  const filtrosGuardados = estadoGuardado.filtros;

  return {
    filtros: {
      q: typeof filtrosGuardados?.q === 'string' ? filtrosGuardados.q : '',
      tipo: typeof filtrosGuardados?.tipo === 'string' ? filtrosGuardados.tipo : '',
      anio: typeof filtrosGuardados?.anio === 'string' ? filtrosGuardados.anio : '',
    },
    resultados: Array.isArray(estadoGuardado.resultados) ? estadoGuardado.resultados : [],
    pagina: Number.isInteger(estadoGuardado.pagina) ? estadoGuardado.pagina : 1,
    totalResultados: Number.isInteger(estadoGuardado.totalResultados)
      ? estadoGuardado.totalResultados
      : 0,
    totalPaginas: Number.isInteger(estadoGuardado.totalPaginas) ? estadoGuardado.totalPaginas : 0,
    hasSearched: Boolean(estadoGuardado.hasSearched),
    ultimaBusqueda:
      estadoGuardado.ultimaBusqueda && typeof estadoGuardado.ultimaBusqueda === 'object'
        ? estadoGuardado.ultimaBusqueda
        : null,
  };
}

function prepararFiltros(filtrosConsulta, pagina) {
  return {
    q: filtrosConsulta.q?.trim() ?? '',
    tipo: filtrosConsulta.tipo || undefined,
    anio: filtrosConsulta.anio || undefined,
    pagina,
  };
}

function convertirFiltros(filtrosConsulta) {
  return {
    q: filtrosConsulta.q,
    tipo: filtrosConsulta.tipo ?? '',
    anio: filtrosConsulta.anio === undefined ? '' : String(filtrosConsulta.anio),
  };
}

function obtenerMensajeValidacion(error) {
  return error.issues[0]?.message ?? 'Revisá los datos ingresados';
}

export function useBusqueda(estadoGuardado) {
  const estadoInicial = obtenerEstadoInicial(estadoGuardado);
  const [filtros, setFiltros] = useState(estadoInicial.filtros);
  const [resultados, setResultados] = useState(estadoInicial.resultados);
  const [pagina, setPagina] = useState(estadoInicial.pagina);
  const [totalResultados, setTotalResultados] = useState(estadoInicial.totalResultados);
  const [totalPaginas, setTotalPaginas] = useState(estadoInicial.totalPaginas);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(estadoInicial.hasSearched);
  const [ultimaBusqueda, setUltimaBusqueda] = useState(estadoInicial.ultimaBusqueda);
  const abortControllerRef = useRef(null);
  const ultimaBusquedaRef = useRef(estadoInicial.ultimaBusqueda);

  const ejecutarBusqueda = useCallback(
    async (filtrosConsulta, { pagina: paginaConsulta = 1, acumular = false } = {}) => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const filtrosPreparados = prepararFiltros(filtrosConsulta, paginaConsulta);
      const validacion = busquedaSchema.safeParse(filtrosPreparados);

      setHasSearched(true);
      setError(null);

      if (!validacion.success) {
        if (!acumular) {
          ultimaBusquedaRef.current = null;
          setUltimaBusqueda(null);
          setResultados([]);
          setPagina(1);
          setTotalResultados(0);
          setTotalPaginas(0);
        }
        setError(obtenerMensajeValidacion(validacion.error));
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const filtrosValidos = validacion.data;
      const filtrosGuardados = convertirFiltros(filtrosValidos);
      ultimaBusquedaRef.current = filtrosGuardados;
      setUltimaBusqueda(filtrosGuardados);

      if (acumular) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setIsLoadingMore(false);
        setResultados([]);
        setPagina(1);
        setTotalResultados(0);
        setTotalPaginas(0);
      }

      try {
        const data = await request('/busqueda', {
          params: filtrosValidos,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setResultados((resultadosActuales) =>
          acumular ? [...resultadosActuales, ...data.resultados] : data.resultados,
        );
        setPagina(data.pagina);
        setTotalResultados(data.totalResultados);
        setTotalPaginas(data.totalPaginas);
      } catch (requestError) {
        if (requestError.name === 'AbortError') {
          return;
        }

        if (!acumular) {
          setResultados([]);
          setPagina(1);
          setTotalResultados(0);
          setTotalPaginas(0);
        }
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'No se pudo completar la búsqueda',
        );
      } finally {
        if (!controller.signal.aborted) {
          if (acumular) {
            setIsLoadingMore(false);
          } else {
            setIsLoading(false);
          }
        }
      }
    },
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
    filtros,
    setFiltros,
    buscar,
    buscarConFiltros,
    cargarMas,
    resultados,
    pagina,
    totalResultados,
    totalPaginas,
    isLoading: isLoading || isLoadingMore,
    isLoadingMore,
    error,
    hasSearched,
    ultimaBusqueda,
  };
}
