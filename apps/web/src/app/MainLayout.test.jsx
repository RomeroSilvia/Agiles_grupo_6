import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { MainLayout } from './MainLayout.jsx';
import { SessionContext } from '../contexts/session/SessionContext.js';
import { RegionContext } from '../contexts/region/RegionContext.js';
import { ThemeContext } from '../contexts/theme/ThemeContext.js';

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
        <SessionContext.Provider
          value={{
            user: null,
            loading: false,
            signUp: async () => {},
            signIn: async () => {},
            signOut: async () => {},
            reloadSession: async () => {},
          }}
        >
          <RegionContext.Provider value={{ region: 'AR', loading: false }}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<p>Contenido de prueba</p>} />
              </Route>
            </Routes>
          </RegionContext.Provider>
        </SessionContext.Provider>
      </ThemeContext.Provider>
    </MemoryRouter>,
  );
}

describe('MainLayout', () => {
  it('centraliza la atribución y no muestra una búsqueda que no funciona', () => {
    renderLayout();

    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
    expect(screen.getAllByText(/Datos de títulos provistos por/)).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Buscar títulos' })).not.toBeInTheDocument();
  });
});
