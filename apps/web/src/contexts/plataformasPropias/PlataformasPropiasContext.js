import { createContext, useContext } from 'react';

export const PlataformasPropiasContext = createContext(null);

export function usePlataformasPropias() {
  const context = useContext(PlataformasPropiasContext);
  if (!context) {
    throw new Error('usePlataformasPropias debe usarse dentro de <PlataformasPropiasProvider>');
  }
  return context;
}
