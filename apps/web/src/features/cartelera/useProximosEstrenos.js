import { useCallback, useEffect, useState } from 'react';
import { consultaEstrenosSchema, respuestaEstrenosSchema } from '@buscador/shared/schemas';
import { listarProximosEstrenos } from './cartelera.api.js';

export function useProximosEstrenos() {
  const [consulta, setConsulta] = useState(() => consultaEstrenosSchema.parse({}));
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    listarProximosEstrenos({ ...consulta, signal: controller.signal })
      .then((respuesta) => {
        const validada = respuestaEstrenosSchema.safeParse(respuesta);
        if (!validada.success) {
          throw new Error('La información de estrenos no tiene un formato válido. Probá de nuevo.');
        }
        const data = validada.data;
        if (!controller.signal.aborted) setEstado({ data, loading: false, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setEstado({
            data: null,
            loading: false,
            error: error.message || 'No se pudieron cargar los próximos estrenos.',
          });
      });
    return () => controller.abort();
  }, [consulta, intento]);
  const consultar = useCallback((valores) => {
    const resultado = consultaEstrenosSchema.safeParse(valores);
    if (!resultado.success) return 'Elegí un período futuro de entre 1 y 90 días.';
    setEstado({ data: null, loading: true, error: '' });
    setConsulta(resultado.data);
    return '';
  }, []);
  const reintentar = useCallback(() => {
    setEstado({ data: null, loading: true, error: '' });
    setIntento((actual) => actual + 1);
  }, []);
  return { ...estado, consulta, consultar, reintentar };
}
