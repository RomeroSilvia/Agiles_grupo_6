import { useCallback, useEffect, useMemo, useState } from 'react';
import { ciudadCineIdSchema, respuestaCiudadesCineSchema } from '@buscador/shared/schemas';
import { request } from '../../services/api.service.js';
import { CiudadCineContext } from './CiudadCineContext.js';

const CLAVE_CIUDAD_CINE = 'streamly.ciudadCine';
const MENSAJE_STORAGE = 'No pudimos guardar la selección en esta pestaña; se perderá al cerrarla.';

function leerCiudadGuardada() {
  try {
    return { id: window.sessionStorage.getItem(CLAVE_CIUDAD_CINE), disponible: true };
  } catch {
    return { id: null, disponible: false };
  }
}

function guardarCiudad(id) {
  try {
    if (id) {
      window.sessionStorage.setItem(CLAVE_CIUDAD_CINE, id);
    } else {
      window.sessionStorage.removeItem(CLAVE_CIUDAD_CINE);
    }
    return true;
  } catch {
    return false;
  }
}

export function CiudadCineProvider({ children }) {
  const [ciudades, setCiudades] = useState([]);
  const [idCiudadSeleccionada, setIdCiudadSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [intento, setIntento] = useState(0);
  const [habilitado, setHabilitado] = useState(false);

  useEffect(() => {
    if (!habilitado) {
      return undefined;
    }

    const controller = new AbortController();
    let cancelado = false;

    request('/cartelera/ciudades', { signal: controller.signal })
      .then((data) => {
        const resultado = respuestaCiudadesCineSchema.safeParse(data);
        if (!resultado.success) {
          throw new Error('La respuesta de ciudades no tiene un formato válido.');
        }

        if (cancelado) {
          return;
        }

        const directorio = resultado.data.ciudades;
        const guardada = leerCiudadGuardada();
        const idValido = ciudadCineIdSchema.safeParse(guardada.id);
        const ciudadGuardada = idValido.success
          ? directorio.find((ciudad) => ciudad.id === idValido.data)
          : null;

        setCiudades(directorio);
        setIdCiudadSeleccionada(
          ciudadGuardada?.cobertura === 'disponible' ? ciudadGuardada.id : null,
        );

        if (!guardada.disponible) {
          setAviso('No pudimos restaurar una ciudad guardada. Elegí una ciudad para continuar.');
        } else if (ciudadGuardada?.cobertura === 'sin_cobertura') {
          const avisoCobertura =
            'La ciudad guardada ya no tiene cobertura verificada. Elegí otra ciudad.';
          setAviso(guardarCiudad(null) ? avisoCobertura : `${avisoCobertura} ${MENSAJE_STORAGE}`);
        } else if (guardada.id && !ciudadGuardada) {
          setAviso(
            guardarCiudad(null)
              ? ''
              : 'No pudimos quitar la ciudad guardada de esta pestaña; elegí una ciudad para continuar.',
          );
        } else {
          setAviso('');
        }
      })
      .catch((cause) => {
        if (!cancelado && cause?.name !== 'AbortError') {
          setError(
            cause instanceof Error ? cause.message : 'No se pudo cargar el directorio de ciudades.',
          );
        }
      })
      .finally(() => {
        if (!cancelado) {
          setLoading(false);
        }
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [habilitado, intento]);

  const seleccionarCiudad = useCallback(
    (id) => {
      if (!id) {
        setIdCiudadSeleccionada(null);
        setAviso(guardarCiudad(null) ? '' : MENSAJE_STORAGE);
        return;
      }

      const resultado = ciudadCineIdSchema.safeParse(id);
      const ciudad = resultado.success ? ciudades.find((item) => item.id === resultado.data) : null;
      if (!ciudad || ciudad.cobertura !== 'disponible') {
        setAviso('Elegí una ciudad con cobertura verificada.');
        return;
      }

      setIdCiudadSeleccionada(ciudad.id);
      setAviso(guardarCiudad(ciudad.id) ? '' : MENSAJE_STORAGE);
    },
    [ciudades],
  );

  const reintentar = useCallback(() => {
    setError('');
    setLoading(true);
    setHabilitado(true);
    setIntento((actual) => actual + 1);
  }, []);
  const cargarDirectorio = useCallback(() => setHabilitado(true), []);

  const ciudadSeleccionada = ciudades.find((ciudad) => ciudad.id === idCiudadSeleccionada) ?? null;
  const value = useMemo(
    () => ({
      ciudades,
      ciudadSeleccionada,
      idCiudadSeleccionada: ciudadSeleccionada?.id ?? null,
      loading,
      error,
      aviso,
      cargarDirectorio,
      seleccionarCiudad,
      reintentar,
    }),
    [
      ciudades,
      ciudadSeleccionada,
      loading,
      error,
      aviso,
      cargarDirectorio,
      seleccionarCiudad,
      reintentar,
    ],
  );

  return <CiudadCineContext.Provider value={value}>{children}</CiudadCineContext.Provider>;
}
