import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { request } from '../../services/api.service.js';
import { useSession } from '../session/SessionContext.js';
import { PlataformasPropiasContext } from './PlataformasPropiasContext.js';

const SIN_SELECCION = new Set();

function conCambio(seleccionadas, plataformaId, activa) {
  const nuevas = new Set(seleccionadas);
  if (activa) {
    nuevas.add(plataformaId);
  } else {
    nuevas.delete(plataformaId);
  }
  return nuevas;
}

export function PlataformasPropiasProvider({ children }) {
  const { user } = useSession();
  const usuarioId = user?.id ?? null;
  const [seleccionadas, setSeleccionadas] = useState(SIN_SELECCION);
  const [cargadasPara, setCargadasPara] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(new Set());
  const [intento, setIntento] = useState(0);
  const enCurso = useRef(new Set());

  useEffect(() => {
    enCurso.current = new Set();
  }, [usuarioId]);

  useEffect(() => {
    if (!usuarioId) {
      return undefined;
    }
    let cancelled = false;
    request('/plataformas/propias')
      .then((ids) => {
        if (!cancelled) {
          setSeleccionadas(new Set(ids));
          setError('');
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setSeleccionadas(SIN_SELECCION);
          setError(cause.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setGuardando(new Set(enCurso.current));
          setCargadasPara(usuarioId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [usuarioId, intento]);

  const recargar = useCallback(() => {
    setCargadasPara(null);
    setIntento((actual) => actual + 1);
  }, []);

  const alternar = useCallback(async (plataformaId, activa) => {
    const pendientes = enCurso.current;
    if (pendientes.has(plataformaId)) {
      return;
    }
    const sigueLaMismaSesion = () => enCurso.current === pendientes;
    pendientes.add(plataformaId);
    setGuardando(new Set(pendientes));
    setSeleccionadas((actuales) => conCambio(actuales, plataformaId, activa));
    try {
      await request(`/plataformas/propias/${plataformaId}`, { method: activa ? 'PUT' : 'DELETE' });
    } catch (cause) {
      if (sigueLaMismaSesion()) {
        setSeleccionadas((actuales) => conCambio(actuales, plataformaId, !activa));
        throw cause;
      }
    } finally {
      pendientes.delete(plataformaId);
      if (sigueLaMismaSesion()) {
        setGuardando(new Set(pendientes));
      }
    }
  }, []);

  const cargadas = usuarioId !== null && cargadasPara === usuarioId;

  const value = useMemo(
    () => ({
      seleccionadas: cargadas ? seleccionadas : SIN_SELECCION,
      guardando: cargadas ? guardando : SIN_SELECCION,
      loading: usuarioId !== null && !cargadas,
      error: cargadas ? error : '',
      alternar,
      recargar,
    }),
    [cargadas, seleccionadas, guardando, usuarioId, error, alternar, recargar],
  );

  return (
    <PlataformasPropiasContext.Provider value={value}>
      {children}
    </PlataformasPropiasContext.Provider>
  );
}
