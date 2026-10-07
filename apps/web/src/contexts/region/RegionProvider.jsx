import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_REGION, FUENTE_REGION, FUENTES_REGION } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';
import { request } from '../../services/api.service.js';
import { useSession } from '../session/SessionContext.js';
import { RegionContext } from './RegionContext.js';

/** Mantiene la región resuelta por la API durante la sesión actual. */
export function RegionProvider({ children }) {
  const { user, loading: sessionLoading } = useSession();
  const identity = user?.id ?? 'guest';
  const [state, setState] = useState({
    identity: null,
    region: DEFAULT_REGION,
    source: FUENTE_REGION.DEFAULT,
  });
  const loading = sessionLoading || state.identity !== identity;

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    let cancelled = false;
    request('/region')
      .then((data) => {
        if (!cancelled) {
          const region = regionSchema.safeParse(data?.region);
          const source = FUENTES_REGION.includes(data?.source) ? data.source : null;
          setState(
            region.success && source
              ? { identity, region: region.data, source }
              : { identity, region: DEFAULT_REGION, source: FUENTE_REGION.DEFAULT },
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ identity, region: DEFAULT_REGION, source: FUENTE_REGION.DEFAULT });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [identity, sessionLoading]);

  const value = useMemo(
    () => ({ region: state.region, source: state.source, loading }),
    [state.region, state.source, loading],
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}
