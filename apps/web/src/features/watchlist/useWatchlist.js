import { useCallback, useEffect, useState } from 'react';
import { request } from '../../services/api.service.js';
import { useSession } from '../../contexts/session/SessionContext.js';
import { rutaWatchlistTitulo } from '../../app/rutas.js';

const ESTADO_VACIO = {
  usuarioId: null,
  titulos: [],
  pagina: 1,
  totalResultados: 0,
  totalPaginas: 0,
  cargando: false,
  cargandoMas: false,
  error: '',
};

function rutaPagina(pagina) {
  return `/watchlist?pagina=${pagina}`;
}

function crearEstado(usuarioId, data) {
  return {
    usuarioId,
    titulos: data.resultados,
    pagina: data.pagina,
    totalResultados: data.totalResultados,
    totalPaginas: data.totalPaginas,
    cargando: false,
    cargandoMas: false,
    error: '',
  };
}

async function listarHastaPagina(paginaFinal) {
  const primeraPagina = await request(rutaPagina(1));
  const paginaFinalDisponible = Math.max(1, Math.min(paginaFinal, primeraPagina.totalPaginas));

  if (paginaFinalDisponible === 1) {
    return primeraPagina;
  }

  const paginasRestantes = await Promise.all(
    Array.from({ length: paginaFinalDisponible - 1 }, (_, indice) =>
      request(rutaPagina(indice + 2)),
    ),
  );

  return {
    ...primeraPagina,
    resultados: [primeraPagina, ...paginasRestantes].flatMap((pagina) => pagina.resultados),
    pagina: paginaFinalDisponible,
  };
}

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
      ...ESTADO_VACIO,
      usuarioId,
      titulos: actual.usuarioId === usuarioId ? actual.titulos : [],
      pagina: actual.usuarioId === usuarioId ? actual.pagina : 1,
      totalResultados: actual.usuarioId === usuarioId ? actual.totalResultados : 0,
      totalPaginas: actual.usuarioId === usuarioId ? actual.totalPaginas : 0,
      cargando: true,
    }));

    request(rutaPagina(1), { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setEstado(crearEstado(usuarioId, data));
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setEstado((actual) => ({
            ...actual,
            usuarioId,
            cargando: false,
            cargandoMas: false,
            error: error.message,
          }));
        }
      });

    return () => controller.abort();
  }, [cargandoSesion, intento, usuarioId]);

  const reintentar = useCallback(() => {
    setEstado((actual) => ({ ...actual, cargando: true, cargandoMas: false, error: '' }));
    setIntento((actual) => actual + 1);
  }, []);

  const estadoActual = estado.usuarioId === usuarioId ? estado : ESTADO_VACIO;

  const cargarMas = useCallback(async () => {
    if (
      !usuarioId ||
      estadoActual.cargando ||
      estadoActual.cargandoMas ||
      estadoActual.pagina >= estadoActual.totalPaginas
    ) {
      return;
    }

    const pagina = estadoActual.pagina + 1;
    setEstado((actual) =>
      actual.usuarioId === usuarioId ? { ...actual, cargandoMas: true, error: '' } : actual,
    );

    try {
      const data = await request(rutaPagina(pagina));
      setEstado((actual) =>
        actual.usuarioId === usuarioId
          ? {
              ...actual,
              titulos: [...actual.titulos, ...data.resultados],
              pagina: data.pagina,
              totalResultados: data.totalResultados,
              totalPaginas: data.totalPaginas,
              cargandoMas: false,
              error: '',
            }
          : actual,
      );
    } catch (error) {
      setEstado((actual) =>
        actual.usuarioId === usuarioId
          ? { ...actual, cargandoMas: false, error: error.message }
          : actual,
      );
    }
  }, [estadoActual, usuarioId]);

  const quitar = useCallback(
    async ({ tipo, tmdbId }) => {
      if (!usuarioId) {
        return;
      }
      const key = `${tipo}:${tmdbId}`;
      if (pendientes.has(key)) {
        return;
      }

      const paginaCargada = estadoActual.pagina;
      setPendientes((actual) => new Set(actual).add(key));
      setEstado((actual) => ({ ...actual, error: '' }));

      try {
        await request(rutaWatchlistTitulo(tipo, tmdbId), { method: 'DELETE' });
        try {
          const data = await listarHastaPagina(paginaCargada);
          setEstado((actual) =>
            actual.usuarioId === usuarioId ? crearEstado(usuarioId, data) : actual,
          );
        } catch {
          setEstado((actual) =>
            actual.usuarioId === usuarioId
              ? {
                  ...actual,
                  titulos: actual.titulos.filter(
                    (item) => item.titulo.tipo !== tipo || item.titulo.tmdbId !== tmdbId,
                  ),
                  totalResultados: Math.max(0, actual.totalResultados - 1),
                  error:
                    'Se quitó el título, pero no pudimos actualizar tu lista. Volvé a intentar.',
                }
              : actual,
          );
        }
      } catch (error) {
        let mensaje = error.message;
        try {
          const data = await listarHastaPagina(paginaCargada);
          setEstado((actual) =>
            actual.usuarioId === usuarioId ? crearEstado(usuarioId, data) : actual,
          );
        } catch {
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
    [estadoActual.pagina, pendientes, usuarioId],
  );

  return {
    titulos: estadoActual.titulos,
    pagina: estadoActual.pagina,
    totalResultados: estadoActual.totalResultados,
    totalPaginas: estadoActual.totalPaginas,
    cargando:
      cargandoSesion ||
      Boolean(usuarioId && (estado.usuarioId !== usuarioId || estadoActual.cargando)),
    cargandoMas: estadoActual.cargandoMas,
    error: estadoActual.error,
    pendientes,
    reintentar,
    cargarMas,
    quitar,
  };
}
