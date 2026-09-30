import { createContext, useContext } from 'react';

export const SessionContext = createContext(null);

/**
 * @typedef {{ id: string, email: string }} User
 * @returns {{
 *   user: User | null,
 *   loading: boolean,
 *   signUp: (credentials: { email: string, password: string }) => Promise<User>,
 *   signIn: (credentials: { email: string, password: string }) => Promise<User>,
 *   signOut: () => Promise<void>,
 *   reloadSession: () => Promise<void>,
 * }}
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>');
  }
  return context;
}
