import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../services/api.service.js';
import { listarPeliculasEnCartelera } from './cartelera.api.js';

function obtenerMensajeError(error) {
  return error instanceof ApiError
    ? error.message
    : 'No se pudo cargar la cartelera. Probá de nuevo.';
}

function acumularPeliculas(actuales, nuevas) {
  const peliculas = new Map(
    actuales.map((pelicula) => [`${pelicula.tipo}:${pelicula.tmdbId}`, pelicula]),
  );
  nuevas.forEach((pelicula) => peliculas.set(`${pelicula.tipo}:${pelicula.tmdbId}`, pelicula));
  return [...peliculas.values()];
}

export function useCartelera() {
  const [resultados, setResultados] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const abortControllerRef = useRef(null);
  const ultimaPaginaSolicitadaRef = useRef(1);

  const solicitarPagina = useCallback((paginaSolicitada) => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    ultimaPaginaSolicitadaRef.current = paginaSolicitada;

    return listarPeliculasEnCartelera({
      pagina: paginaSolicitada,
      signal: controller.signal,
    })
      .then((data) => ({ data, controller }))
      .catch((requestError) => ({ error: requestError, controller }));
  }, []);

  const procesarSolicitud = useCallback(
    ({ data, error: requestError, controller }, { acumular = false } = {}) => {
      if (controller.signal.aborted || abortControllerRef.current !== controller) {
        return;
      }

      if (requestError) {
        setError(obtenerMensajeError(requestError));
      } else {
        setResultados((actuales) =>
          acumular ? acumularPeliculas(actuales, data.resultados) : data.resultados,
        );
        setPagina(data.pagina);
        setTotalPaginas(data.totalPaginas);
        setError('');
      }

      setHasSearched(true);
      setIsLoading(false);
      setIsLoadingMore(false);
    },
    [],
  );

  const reintentar = useCallback(() => {
    const paginaSolicitada = ultimaPaginaSolicitadaRef.current;
    const acumular = paginaSolicitada > 1;
    setError('');
    setIsLoading(!acumular);
    setIsLoadingMore(acumular);
    return solicitarPagina(paginaSolicitada).then((resultado) =>
      procesarSolicitud(resultado, { acumular }),
    );
  }, [procesarSolicitud, solicitarPagina]);

  const cargarMas = useCallback(() => {
    if (isLoading || isLoadingMore || pagina >= totalPaginas) {
      return;
    }
    setError('');
    setIsLoadingMore(true);
    return solicitarPagina(pagina + 1).then((resultado) =>
      procesarSolicitud(resultado, { acumular: true }),
    );
  }, [isLoading, isLoadingMore, pagina, procesarSolicitud, solicitarPagina, totalPaginas]);

  useEffect(() => {
    solicitarPagina(1).then((resultado) => procesarSolicitud(resultado));
    return () => abortControllerRef.current?.abort();
  }, [procesarSolicitud, solicitarPagina]);

  return {
    resultados,
    pagina,
    totalPaginas,
    isLoading,
    isLoadingMore,
    hasSearched,
    error,
    reintentar,
    cargarMas,
  };
}
