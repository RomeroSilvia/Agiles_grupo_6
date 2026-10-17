import { useCallback, useEffect, useState } from 'react';
import { request } from '../../services/api.service.js';
import { useSession } from '../../contexts/session/SessionContext.js';
import { rutaWatchlistTitulo } from '../../app/rutas.js';

const ESTADO_VACIO = { usuarioId: null, titulos: [], cargando: false, error: '' };

export function useWatchlist() {
  const { user, loading: cargandoSesion } = useSession();
  const usuarioId = user?.id ?? null;
  const [estado, setEstado] = useState(ESTADO_VACIO);
  const [pendientes, setPendientes] = useState(new Set());
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (cargandoSesion) {
      return undefined;
    }
    if (!usuarioId) {
      setEstado(ESTADO_VACIO);
      setPendientes(new Set());
      return undefined;
    }

    const controller = new AbortController();
    setEstado((actual) => ({
      usuarioId,
      titulos: actual.usuarioId === usuarioId ? actual.titulos : [],
      cargando: true,
      error: '',
    }));

    request('/watchlist', { signal: controller.signal })
      .then((titulos) => {
        if (!controller.signal.aborted) {
          setEstado({ usuarioId, titulos, cargando: false, error: '' });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setEstado((actual) => ({
            usuarioId,
            titulos: actual.usuarioId === usuarioId ? actual.titulos : [],
            cargando: false,
            error: error.message,
          }));
        }
      });

    return () => controller.abort();
  }, [cargandoSesion, intento, usuarioId]);

  const reintentar = useCallback(() => {
    setEstado((actual) => ({ ...actual, cargando: true, error: '' }));
    setIntento((actual) => actual + 1);
  }, []);

  const quitar = useCallback(
    async ({ tipo, tmdbId }) => {
      if (!usuarioId) {
        return;
      }
      const key = `${tipo}:${tmdbId}`;
      if (pendientes.has(key)) {
        return;
      }

      setPendientes((actual) => new Set(actual).add(key));
      setEstado((actual) => ({ ...actual, error: '' }));
      try {
        await request(rutaWatchlistTitulo(tipo, tmdbId), { method: 'DELETE' });
        setEstado((actual) =>
          actual.usuarioId === usuarioId
            ? {
                ...actual,
                titulos: actual.titulos.filter(
                  (item) => item.titulo.tipo !== tipo || item.titulo.tmdbId !== tmdbId,
                ),
              }
            : actual,
        );
      } catch (error) {
        let mensaje = error.message;
        try {
          const titulos = await request('/watchlist');
          setEstado((actual) => (actual.usuarioId === usuarioId ? { ...actual, titulos } : actual));
        } catch {
          // Se conserva la lista anterior y se informa que no se pudo confirmar el cambio.
          mensaje = `${mensaje}. No pudimos confirmar el estado guardado; volvé a intentar.`;
        }
        setEstado((actual) =>
          actual.usuarioId === usuarioId ? { ...actual, error: mensaje } : actual,
        );
      } finally {
        setPendientes((actual) => {
          const nuevas = new Set(actual);
          nuevas.delete(key);
          return nuevas;
        });
      }
    },
    [pendientes, usuarioId],
  );

  const estadoActual = estado.usuarioId === usuarioId ? estado : ESTADO_VACIO;
  return {
    titulos: estadoActual.titulos,
    cargando:
      cargandoSesion ||
      Boolean(usuarioId && (estado.usuarioId !== usuarioId || estadoActual.cargando)),
    error: estadoActual.error,
    pendientes,
    reintentar,
    quitar,
  };
}
