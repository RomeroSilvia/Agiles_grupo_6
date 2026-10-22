import { useCallback, useEffect, useRef, useState } from 'react';
import { regionesComparacionSchema } from '@buscador/shared/schemas';
import { ApiError, request } from '../../services/api.service.js';

export function useComparacionRegiones({ tipo, tmdbId } = {}) {
  const tieneParametros = Boolean(tipo && tmdbId);
  const claveTitulo = tieneParametros ? `${tipo}/${tmdbId}` : null;
  const [estado, setEstado] = useState({
    clave: null,
    regiones: [],
    regionesFallidas: [],
    error: null,
    consultado: false,
    isLoading: false,
  });
  const abortControllerRef = useRef(null);
  const ultimaSeleccionRef = useRef([]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [claveTitulo]);

  const ejecutarComparacion = useCallback(
    async (codigos) => {
      if (!tieneParametros) {
        setEstado({
          clave: claveTitulo,
          regiones: [],
          regionesFallidas: [],
          error: 'No se pudo identificar el título.',
          consultado: false,
          isLoading: false,
        });
        return;
      }

      const validacion = regionesComparacionSchema.safeParse(codigos);
      if (!validacion.success) {
        const mensaje =
          validacion.error.issues?.[0]?.message ?? 'Seleccioná regiones válidas para comparar.';
        setEstado((previo) => ({
          ...(previo.clave === claveTitulo
            ? previo
            : { regiones: [], regionesFallidas: [], consultado: false }),
          clave: claveTitulo,
          error: mensaje,
          isLoading: false,
        }));
        return;
      }

      ultimaSeleccionRef.current = validacion.data;
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setEstado((previo) => ({
        ...(previo.clave === claveTitulo
          ? previo
          : { regiones: [], regionesFallidas: [], consultado: false }),
        clave: claveTitulo,
        error: null,
        isLoading: true,
      }));

      try {
        const query = encodeURIComponent(validacion.data.join(','));
        const data = await request(
          `/titulos/${encodeURIComponent(tipo)}/${encodeURIComponent(tmdbId)}/disponibilidad/comparacion?regiones=${query}`,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) {
          return;
        }

        setEstado({
          clave: claveTitulo,
          regiones: Array.isArray(data?.regiones) ? data.regiones : [],
          regionesFallidas: Array.isArray(data?.regionesFallidas) ? data.regionesFallidas : [],
          error: null,
          consultado: true,
          isLoading: false,
        });
      } catch (requestError) {
        if (requestError.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        setEstado({
          clave: claveTitulo,
          regiones: [],
          regionesFallidas: [],
          error:
            requestError instanceof ApiError
              ? requestError.message
              : 'No se pudo comparar la disponibilidad entre regiones.',
          consultado: false,
          isLoading: false,
        });
      }
    },
    [claveTitulo, tieneParametros, tipo, tmdbId],
  );

  const reintentar = useCallback(() => {
    if (ultimaSeleccionRef.current.length > 0) {
      ejecutarComparacion(ultimaSeleccionRef.current);
    }
  }, [ejecutarComparacion]);

  const esActual = estado.clave === claveTitulo;

  return {
    regiones: esActual ? estado.regiones : [],
    regionesFallidas: esActual ? estado.regionesFallidas : [],
    error: esActual ? estado.error : null,
    consultado: esActual ? estado.consultado : false,
    isLoading: esActual ? estado.isLoading : false,
    comparar: ejecutarComparacion,
    reintentar,
  };
}
