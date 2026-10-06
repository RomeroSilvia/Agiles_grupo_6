import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_REGION } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';
import { request } from '../../services/api.service.js';
import { useSession } from '../session/SessionContext.js';
import { RegionContext } from './RegionContext.js';

/** Mantiene la región resuelta por la API durante la sesión actual. */
export function RegionProvider({ children }) {
  const { user, loading: sessionLoading } = useSession();
  const identity = user?.id ?? 'guest';
  const [state, setState] = useState({ identity: null, region: DEFAULT_REGION, source: 'default' });
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
          setState({
            identity,
            region: region.success ? region.data : DEFAULT_REGION,
            source: region.success ? data.source : 'default',
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ identity, region: DEFAULT_REGION, source: 'default' });
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
