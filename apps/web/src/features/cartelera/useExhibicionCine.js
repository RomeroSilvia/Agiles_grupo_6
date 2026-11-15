import { respuestaExhibicionCineSchema } from '@buscador/shared/schemas';
import { useEffect, useState } from 'react';
import { obtenerExhibicionPelicula } from './cartelera.api.js';
export function useExhibicionCine({ tipo, tmdbId }) {
  const [estado, setEstado] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    if (tipo === 'pelicula') {
      obtenerExhibicionPelicula({ tmdbId, signal: controller.signal })
        .then((data) => {
          if (!controller.signal.aborted)
            setEstado({
              tmdbId,
              consultable: respuestaExhibicionCineSchema.parse(data).consultable,
            });
        })
        .catch(() => {
          if (!controller.signal.aborted) setEstado({ tmdbId, consultable: false });
        });
    }
    return () => controller.abort();
  }, [tipo, tmdbId]);
  return tipo === 'pelicula' && estado?.tmdbId === tmdbId && estado.consultable;
}
