import { createContext, useContext } from 'react';

export const THEME_STORAGE_KEY = 'theme';

/** @typedef {'light' | 'dark'} Theme */

export const ThemeContext = createContext(null);

/** @returns {Theme} */
export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // sin acceso a localStorage
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** @returns {{ theme: Theme, toggleTheme: () => void }} */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  }
  return context;
}
