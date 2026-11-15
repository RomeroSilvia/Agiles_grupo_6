import { respuestaExhibicionCineSchema } from '@buscador/shared/schemas';
import { useCallback, useEffect, useState } from 'react';
import { obtenerExhibicionPelicula } from './cartelera.api.js';
export function useExhibicionCine({ tipo, tmdbId }) {
  const [estado, setEstado] = useState(null);
  const [intento, setIntento] = useState(0);
  const reintentar = useCallback(() => setIntento((actual) => actual + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    if (tipo === 'pelicula') {
      obtenerExhibicionPelicula({ tmdbId, signal: controller.signal })
        .then((data) => {
          if (!controller.signal.aborted)
            setEstado({
              tmdbId,
              intento,
              consultable: respuestaExhibicionCineSchema.parse(data).consultable,
              error: '',
            });
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setEstado({
              tmdbId,
              intento,
              consultable: null,
              error:
                'No pudimos verificar si esta película tiene exhibición en cines. Probá de nuevo.',
            });
        });
    }
    return () => controller.abort();
  }, [tipo, tmdbId, intento]);
  const habilitado = tipo === 'pelicula';
  const vigente = habilitado && estado?.tmdbId === tmdbId && estado.intento === intento;
  return {
    consultable: vigente ? estado.consultable : null,
    loading: habilitado && !vigente,
    error: vigente ? estado.error : '',
    reintentar,
  };
}
