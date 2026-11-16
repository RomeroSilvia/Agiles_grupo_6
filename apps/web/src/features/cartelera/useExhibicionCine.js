import { useCallback } from 'react';
import { TIPO_TITULO } from '@buscador/shared/constants';
import { respuestaExhibicionCineSchema } from '@buscador/shared/schemas';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import { obtenerExhibicionPelicula } from './cartelera.api.js';

const MENSAJE_ERROR =
  'No pudimos verificar si esta película tiene exhibición en cines. Probá de nuevo.';

export function useExhibicionCine({ tipo, tmdbId }) {
  const solicitar = useCallback(
    ({ signal }) =>
      obtenerExhibicionPelicula({ tmdbId, signal }).then(
        (data) => respuestaExhibicionCineSchema.parse(data).consultable,
      ),
    [tmdbId],
  );
  const { datos, isLoading, error, reintentar } = useRemoteData({
    clave: tmdbId,
    habilitado: tipo === TIPO_TITULO.PELICULA,
    solicitar,
    mensajeError: MENSAJE_ERROR,
  });

  return {
    consultable: datos,
    loading: isLoading,
    error: error ? MENSAJE_ERROR : '',
    reintentar,
  };
}
