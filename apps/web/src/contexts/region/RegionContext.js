import { createContext, useContext } from 'react';

export const RegionContext = createContext(null);

/** @returns {{ region: string, source: 'ip' | 'profile' | 'default', loading: boolean }} */
export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion debe usarse dentro de <RegionProvider>');
  }
  return context;
}
