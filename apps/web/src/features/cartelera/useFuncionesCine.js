import { useCallback, useEffect, useState } from 'react';
import {
  consultaFuncionesCineSchema,
  parametrosFuncionesCineSchema,
  respuestaFuncionesCineSchema,
} from '@buscador/shared/schemas';
import { request } from '../../services/api.service.js';

export function useFuncionesCine({ tmdbId, ciudadId }) {
  const clave = `${tmdbId}:${ciudadId ?? ''}`;
  const [peliculaHabilitada, setPeliculaHabilitada] = useState(null);
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState(null);
  const [contexto, setContexto] = useState(clave);
  if (contexto !== clave) {
    setContexto(clave);
    setEstado(null);
  }
  const habilitado = peliculaHabilitada === String(tmdbId) && Boolean(ciudadId);
  useEffect(() => {
    if (!habilitado) return undefined;
    const controller = new AbortController();
    const params = parametrosFuncionesCineSchema.safeParse({ tmdbId });
    const query = consultaFuncionesCineSchema.safeParse({ ciudadId });
    if (!params.success || !query.success) return undefined;
    request(`/cartelera/peliculas/${params.data.tmdbId}/funciones`, {
      params: query.data,
      signal: controller.signal,
    })
      .then((respuesta) => {
        const validada = respuestaFuncionesCineSchema.safeParse(respuesta);
        if (!validada.success) {
          throw new Error(
            'La información de funciones no tiene un formato válido. Probá de nuevo.',
          );
        }
        const data = validada.data;
        if (data.tmdbId !== params.data.tmdbId || data.ciudad.id !== ciudadId)
          throw new Error('La respuesta no corresponde a la película y ciudad seleccionadas.');
        if (!controller.signal.aborted) setEstado({ clave, intento, data, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setEstado({
            clave,
            intento,
            data: null,
            error: error.message || 'No se pudieron consultar las funciones.',
          });
      });
    return () => controller.abort();
  }, [clave, tmdbId, ciudadId, habilitado, intento]);
  const consultar = useCallback(() => {
    if (
      !parametrosFuncionesCineSchema.safeParse({ tmdbId }).success ||
      !consultaFuncionesCineSchema.safeParse({ ciudadId }).success
    )
      return;
    setPeliculaHabilitada(String(tmdbId));
    setIntento((actual) => actual + 1);
  }, [tmdbId, ciudadId]);
  const vigente = habilitado && estado?.clave === clave && estado?.intento === intento;
  return {
    data: vigente ? estado.data : null,
    error: vigente ? estado.error : '',
    loading: habilitado && !vigente,
    consultar,
  };
}
