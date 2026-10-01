import { useCallback, useEffect, useRef, useState } from 'react';
import { request, ApiError } from '../services/api.service.js';

const FILTROS_INICIALES = {
  q: '',
  tipo: '',
  anio: '',
};

export function useBusqueda() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [resultados, setResultados] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortControllerRef = useRef(null);

  const buscar = useCallback(async (filtrosConsulta) => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const q = filtrosConsulta.q.trim();

    setHasSearched(true);
    setError(null);

    if (!q) {
      setResultados([]);
      setPagina(1);
      setTotalResultados(0);
      setTotalPaginas(0);
      setError('Ingresá un título para buscar');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const data = await request('/busqueda', {
        params: {
          q,
          tipo: filtrosConsulta.tipo || undefined,
          anio: filtrosConsulta.anio || undefined,
          pagina: 1,
        },
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setResultados(data.resultados);
      setPagina(data.pagina);
      setTotalResultados(data.totalResultados);
      setTotalPaginas(data.totalPaginas);
    } catch (requestError) {
      if (requestError.name === 'AbortError') {
        return;
      }

      setResultados([]);
      setPagina(1);
      setTotalResultados(0);
      setTotalPaginas(0);
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'No se pudo completar la búsqueda',
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  return {
    filtros,
    setFiltros,
    buscar,
    resultados,
    pagina,
    totalResultados,
    totalPaginas,
    isLoading,
    error,
    hasSearched,
  };
}
