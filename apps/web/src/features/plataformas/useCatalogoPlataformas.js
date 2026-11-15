import { useCallback, useEffect, useState } from 'react';
import { request } from '../../services/api.service.js';

export function useCatalogoPlataformas() {
  const [plataformas, setPlataformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelled = false;
    request('/plataformas')
      .then((catalogo) => {
        if (!cancelled) {
          setPlataformas(catalogo);
          setError('');
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
  }, [intento]);

  const reintentar = useCallback(() => {
    setError('');
    setLoading(true);
    setIntento((actual) => actual + 1);
  }, []);

  return { plataformas, loading, error, reintentar };
}
