import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MainLayout } from './MainLayout.jsx';
import { SessionContext } from '../contexts/session/SessionContext.js';
import { RegionContext } from '../contexts/region/RegionContext.js';
import { ThemeContext } from '../contexts/theme/ThemeContext.js';

function renderLayout({ user = null } = {}) {
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
          user,
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

  it('muestra el acceso público a la cartelera', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: 'Cartelera' })).toHaveAttribute('href', '/cartelera');
  });
  it('muestra el acceso público a los eventos de Cooltura', () => {
    renderLayout();
    expect(screen.getByRole('link', { name: 'Cooltura' })).toHaveAttribute('href', '/cooltura');
  });

  it('sin sesión muestra solo los enlaces públicos y el acceso a la watchlist', () => {
    renderLayout();

    const explorar = screen.getByRole('navigation', { name: 'Explorar' });
    expect(
      within(explorar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Según tu ánimo', 'Cartelera', 'Cooltura']);
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi watchlist' })).toHaveAttribute(
      'href',
      '/watchlist',
    );
  });

  it('en celular el menú muestra Cartelera, Cooltura y la watchlist aunque no haya sesión', async () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const menu = screen.getByRole('navigation', { name: 'Menú' });
    expect(
      within(menu)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Según tu ánimo', 'Cartelera', 'Cooltura', 'Mi watchlist']);
  });

  it('con sesión suma los enlaces de la cuenta, sin el panel si no es admin', () => {
    renderLayout({ user: { id: 'u1', email: 'ana@mail.com', esAdmin: false } });

    const principal = screen.getByRole('navigation', { name: 'Principal' });
    expect(
      within(principal)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Mi watchlist', 'Mis plataformas', 'Perfil']);
  });

  it('a un admin le muestra el acceso al panel de administración', () => {
    renderLayout({ user: { id: 'u1', email: 'admin@mail.com', esAdmin: true } });

    const principal = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(principal).getByRole('link', { name: 'Administración' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });
});
