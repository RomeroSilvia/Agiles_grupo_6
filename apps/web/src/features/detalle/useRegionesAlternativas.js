import { useCallback, useEffect, useState } from 'react';
import { ApiError, request } from '../../services/api.service.js';

export function useRegionesAlternativas({ tipo, tmdbId, region, activo = false } = {}) {
  const tieneParametros = Boolean(tipo && tmdbId && region);
  const claveParametros = tieneParametros && activo ? `${tipo}/${tmdbId}/${region}` : null;
  const [alternativas, setAlternativas] = useState([]);
  const [error, setError] = useState(null);
  const [claveCargada, setClaveCargada] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const reintentar = useCallback(() => {
    setClaveCargada(null);
    setRecarga((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!claveParametros) {
      return () => controller.abort();
    }

    const queryRegion = `?region=${encodeURIComponent(region)}`;
    request(
      `/titulos/${encodeURIComponent(tipo)}/${encodeURIComponent(tmdbId)}/disponibilidad/alternativas${queryRegion}`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setAlternativas(Array.isArray(data?.alternativas) ? data.alternativas : []);
          setError(null);
          setClaveCargada(claveParametros);
        }
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        setAlternativas([]);
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'No se pudo consultar la disponibilidad en regiones alternativas.',
        );
        setClaveCargada(claveParametros);
      });

    return () => controller.abort();
  }, [claveParametros, tipo, tmdbId, region, recarga]);

  const esConsultaActual = Boolean(claveParametros) && claveCargada === claveParametros;

  return {
    alternativas: esConsultaActual ? alternativas : [],
    isLoading: Boolean(claveParametros) && !esConsultaActual,
    error: esConsultaActual ? error : null,
    reintentar,
  };
}
