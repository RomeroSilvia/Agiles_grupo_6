import { useEffect, useState } from 'react';
import { ApiError, request } from '../../services/api.service.js';

export function useDisponibilidad({ tipo, tmdbId, region, regionLoading }) {
  const active = Boolean(tipo && tmdbId && region && !regionLoading);
  const key = active ? `${tipo}/${tmdbId}/${region}` : null;
  const [state, setState] = useState({ key: null, disponibilidad: null, error: null });

  useEffect(() => {
    if (!active) {
      return;
    }

    const controller = new AbortController();
    request(`/titulos/${encodeURIComponent(tipo)}/${encodeURIComponent(tmdbId)}/disponibilidad`, {
      params: { region },
      signal: controller.signal,
    })
      .then((disponibilidad) => {
        if (!controller.signal.aborted) {
          setState({ key, disponibilidad, error: null });
        }
      })
      .catch((error) => {
        if (error.name === 'AbortError' || controller.signal.aborted) {
          return;
        }
        setState({
          key,
          disponibilidad: null,
          error:
            error instanceof ApiError
              ? error.message
              : 'No se pudo consultar la disponibilidad del título.',
        });
      });

    return () => controller.abort();
  }, [active, key, region, tipo, tmdbId]);

  return {
    disponibilidad: state.key === key ? state.disponibilidad : null,
    isLoading: active && state.key !== key,
    error: state.key === key ? state.error : null,
  };
}
