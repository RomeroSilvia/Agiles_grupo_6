import { useCallback, useEffect, useState } from 'react';
import { request } from '../../services/api.service.js';
import { useSession } from '../../contexts/session/SessionContext.js';
import { rutaWatchlistTitulo } from '../../app/rutas.js';

const ESTADO_VACIO = { key: null, cargando: false, cargado: false, agregado: false, error: '' };

export function useWatchlistTitle({ tipo, tmdbId } = {}) {
  const { user, loading: cargandoSesion } = useSession();
  const usuarioId = user?.id ?? null;
  const tieneParametros = Boolean(tipo && tmdbId);
  const ruta = tieneParametros ? rutaWatchlistTitulo(tipo, tmdbId) : null;
  const key = usuarioId && ruta ? `${usuarioId}:${ruta}` : null;
  const [estado, setEstado] = useState(ESTADO_VACIO);
  const [intento, setIntento] = useState(0);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    if (cargandoSesion || !usuarioId || !ruta || !key) {
      return undefined;
    }

    const controller = new AbortController();

    request(ruta, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setEstado({ key, cargando: false, cargado: true, agregado: data.agregado, error: '' });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setEstado({
            key,
            cargando: false,
            cargado: false,
            agregado: false,
            error: error.message,
          });
        }
      });

    return () => controller.abort();
  }, [cargandoSesion, intento, key, ruta, usuarioId]);

  const reintentar = useCallback(() => {
    setEstado(ESTADO_VACIO);
    setIntento((actual) => actual + 1);
  }, []);

  const alternar = useCallback(async () => {
    const estadoActual = estado.key === key ? estado : ESTADO_VACIO;
    if (!usuarioId || !ruta || !estadoActual.cargado || actualizando) {
      return;
    }

    const agregado = !estadoActual.agregado;
    setActualizando(true);
    try {
      await request(ruta, { method: agregado ? 'PUT' : 'DELETE' });
      setEstado((actual) =>
        actual.key === key ? { key, cargando: false, cargado: true, agregado, error: '' } : actual,
      );
    } catch (error) {
      let estadoPersistido = estadoActual.agregado;
      let estadoConfirmado = false;
      let mensajeError = `${error.message}. No pudimos confirmar el estado guardado.`;
      try {
        const data = await request(ruta);
        estadoPersistido = data.agregado;
        estadoConfirmado = true;
        mensajeError = error.message;
      } catch {
        // Se conserva el último estado confirmado si tampoco se puede consultar la API.
      }
      setEstado((actual) =>
        actual.key === key
          ? {
              key,
              cargando: false,
              cargado: estadoConfirmado,
              agregado: estadoPersistido,
              error: mensajeError,
            }
          : actual,
      );
    } finally {
      setActualizando(false);
    }
  }, [actualizando, estado, key, ruta, usuarioId]);

  const estadoActual = estado.key === key ? estado : ESTADO_VACIO;
  return {
    agregado: estadoActual.agregado,
    estadoCargado: estadoActual.cargado,
    cargando: cargandoSesion || Boolean(usuarioId && !estadoActual.cargado && !estadoActual.error),
    actualizando,
    error: estadoActual.error,
    alternar,
    reintentar,
  };
}
