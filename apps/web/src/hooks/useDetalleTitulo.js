import { useEffect, useState } from 'react';
import { ApiError, request } from '../services/api.service.js';

export function useDetalleTitulo({ tipo, tmdbId } = {}) {
  const tieneParametros = Boolean(tipo && tmdbId);
  const claveParametros = tieneParametros ? `${tipo}/${tmdbId}` : null;
  const [titulo, setTitulo] = useState(null);
  const [error, setError] = useState(null);
  const [claveCargada, setClaveCargada] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    if (!tieneParametros) {
      return () => controller.abort();
    }

    request(`/titulos/${encodeURIComponent(tipo)}/${encodeURIComponent(tmdbId)}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setTitulo(data);
          setError(null);
          setClaveCargada(claveParametros);
        }
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        setTitulo(null);
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'No se pudo cargar el detalle del título.',
        );
        setClaveCargada(claveParametros);
      });

    return () => controller.abort();
  }, [claveParametros, tieneParametros, tipo, tmdbId]);

  const esDetalleActual = tieneParametros && claveCargada === claveParametros;

  return {
    titulo: esDetalleActual ? titulo : null,
    isLoading: tieneParametros && !esDetalleActual,
    error: !tieneParametros ? 'No se pudo identificar el título.' : esDetalleActual ? error : null,
  };
}
