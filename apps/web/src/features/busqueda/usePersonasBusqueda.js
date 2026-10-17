import { useCallback } from 'react';
import { personaBusquedaSchema } from '@buscador/shared/schemas';
import { DEBOUNCE_BUSQUEDA_PERSONAS_MS } from './busqueda.constants.js';
import { buscarPersonasBusqueda } from './busqueda.api.js';
import { useRemoteOptions } from '../../hooks/useRemoteOptions.js';

const MENSAJE_ERROR = 'No se pudieron buscar personas. Probá de nuevo.';

export function usePersonasBusqueda({ consulta, rol, seleccionada }) {
  const validacion = personaBusquedaSchema.safeParse({ q: consulta, rol });
  const q = validacion.success ? validacion.data.q : '';
  const solicitar = useCallback(
    async ({ signal }) => {
      const personas = await buscarPersonasBusqueda({ q, rol, signal });
      if (!Array.isArray(personas)) {
        throw new Error('Respuesta de personas inválida');
      }
      return personas;
    },
    [q, rol],
  );
  const respuesta = useRemoteOptions({
    clave: `${rol}:${q}`,
    habilitado: validacion.success && !seleccionada,
    solicitar,
    esperaMs: DEBOUNCE_BUSQUEDA_PERSONAS_MS,
    mensajeError: MENSAJE_ERROR,
  });

  return {
    personas: Array.isArray(respuesta.datos) && !seleccionada ? respuesta.datos : [],
    isLoading: respuesta.isLoading,
    error: respuesta.error,
    reintentar: respuesta.reintentar,
  };
}
