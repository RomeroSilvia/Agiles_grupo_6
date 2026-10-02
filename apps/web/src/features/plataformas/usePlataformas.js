import { useCallback, useEffect, useState } from 'react';
import { request } from '../../services/api.service.js';

function conCambio(seleccionadas, plataformaId, activa) {
  const nuevas = new Set(seleccionadas);
  if (activa) {
    nuevas.add(plataformaId);
  } else {
    nuevas.delete(plataformaId);
  }
  return nuevas;
}

export function usePlataformas() {
  const [plataformas, setPlataformas] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([request('/plataformas'), request('/plataformas/propias')])
      .then(([catalogo, propias]) => {
        if (!cancelled) {
          setPlataformas(catalogo);
          setSeleccionadas(new Set(propias));
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const alternar = useCallback(async (plataformaId, activa) => {
    setError('');
    setSeleccionadas((actuales) => conCambio(actuales, plataformaId, activa));
    try {
      await request(`/plataformas/propias/${plataformaId}`, { method: activa ? 'PUT' : 'DELETE' });
    } catch (cause) {
      setSeleccionadas((actuales) => conCambio(actuales, plataformaId, !activa));
      setError(cause.message);
    }
  }, []);

  return { plataformas, seleccionadas, loading, error, alternar };
}
