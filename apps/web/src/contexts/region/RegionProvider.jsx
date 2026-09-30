import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_REGION } from '@buscador/shared/constants';
import { request } from '../../services/api.service.js';
import { RegionContext } from './RegionContext.js';

/** Región detectada por la API (E2HU1). Mientras carga, usa la región por defecto. */
export function RegionProvider({ children }) {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    request('/region')
      .then((data) => {
        if (!cancelled) {
          setRegion(data.region);
        }
      })
      .catch(() => {
        // si falla, queda la región por defecto
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

  const value = useMemo(() => ({ region, loading }), [region, loading]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}
