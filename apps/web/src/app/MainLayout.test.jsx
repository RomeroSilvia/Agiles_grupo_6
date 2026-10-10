import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MainLayout } from './MainLayout.jsx';
import { SessionContext } from '../contexts/session/SessionContext.js';
import { RegionContext } from '../contexts/region/RegionContext.js';
import { ThemeContext } from '../contexts/theme/ThemeContext.js';

function renderLayout() {
  const router = createMemoryRouter([
    {
      Component: MainLayout,
      children: [{ path: '/', element: <p>Contenido de prueba</p> }],
    },
  ]);

  return render(
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
          <RouterProvider router={router} />
        </RegionContext.Provider>
      </SessionContext.Provider>
    </ThemeContext.Provider>,
  );
}

describe('MainLayout', () => {
  it('centraliza la atribución y no muestra una búsqueda que no funciona', () => {
    renderLayout();

    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
    expect(screen.getAllByText(/Datos de títulos provistos por/)).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Buscar títulos' })).not.toBeInTheDocument();
  });

  it('muestra el logo como enlace al inicio', () => {
    renderLayout();

    const inicio = screen.getByRole('link', { name: 'Streamly, ir al inicio' });
    expect(inicio).toHaveAttribute('href', '/');
    expect(inicio.querySelector('img')).toBeInTheDocument();
  });
});
