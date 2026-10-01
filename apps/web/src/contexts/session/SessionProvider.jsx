import { useCallback, useEffect, useMemo, useState } from 'react';
import { request } from '../../services/api.service.js';
import { SessionContext } from './SessionContext.js';

async function fetchCurrentUser() {
  const data = await request('/auth/session').catch(() => null);
  return data?.user ?? null;
}

/**
 * Mantiene el usuario autenticado. Los tokens viven en cookies httpOnly:
 * el front solo pregunta a la API quién es el usuario actual.
 * signUp y signIn lanzan ApiError si la API rechaza los datos.
 */
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser().then((currentUser) => {
      if (!cancelled) {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(async ({ email, password }) => {
    const data = await request('/auth/sign-up', { method: 'POST', body: { email, password } });
    setUser(data.user);
    return data.user;
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const data = await request('/auth/sign-in', { method: 'POST', body: { email, password } });
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    await request('/auth/sign-out', { method: 'POST' }).catch(() => null);
    setUser(null);
  }, []);

  const reloadSession = useCallback(async () => {
    setUser(await fetchCurrentUser());
  }, []);

  const value = useMemo(
    () => ({ user, loading, signUp, signIn, signOut, reloadSession }),
    [user, loading, signUp, signIn, signOut, reloadSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
