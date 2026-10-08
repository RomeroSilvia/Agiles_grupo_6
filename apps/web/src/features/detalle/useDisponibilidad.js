import { useCallback, useEffect, useState } from 'react';
import { ApiError, request } from '../../services/api.service.js';

export function useDisponibilidad({ tipo, tmdbId, region } = {}) {
  const tieneParametros = Boolean(tipo && tmdbId);
  const claveParametros = tieneParametros ? `${tipo}/${tmdbId}/${region ?? ''}` : null;
  const [plataformas, setPlataformas] = useState([]);
  const [error, setError] = useState(null);
  const [claveCargada, setClaveCargada] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const reintentar = useCallback(() => {
    setClaveCargada(null);
    setRecarga((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!tieneParametros) {
      return () => controller.abort();
    }

    const queryRegion = region ? `?region=${encodeURIComponent(region)}` : '';
    request(
      `/titulos/${encodeURIComponent(tipo)}/${encodeURIComponent(tmdbId)}/disponibilidad${queryRegion}`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setPlataformas(Array.isArray(data?.plataformas) ? data.plataformas : []);
          setError(null);
          setClaveCargada(claveParametros);
        }
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        setPlataformas([]);
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'No se pudo consultar la disponibilidad.',
        );
        setClaveCargada(claveParametros);
      });

    return () => controller.abort();
  }, [claveParametros, tieneParametros, tipo, tmdbId, region, recarga]);

  const esDetalleActual = tieneParametros && claveCargada === claveParametros;

  return {
    plataformas: esDetalleActual ? plataformas : [],
    isLoading: tieneParametros && !esDetalleActual,
    error: !tieneParametros ? 'No se pudo identificar el título.' : esDetalleActual ? error : null,
    reintentar,
  };
}
