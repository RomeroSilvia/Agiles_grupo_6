import { createContext, useContext } from 'react';

export const CiudadCineContext = createContext(null);

export function useCiudadCine() {
  const context = useContext(CiudadCineContext);
  if (!context) {
    throw new Error('useCiudadCine debe usarse dentro de <CiudadCineProvider>');
  }
  return context;
}
