import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { TabsNav } from './TabsNav.jsx';
import { StarIcon } from './icons.jsx';

const TABS = [
  { to: '/uno', label: 'Uno', Icono: StarIcon },
  { to: '/dos', label: 'Dos' },
];

function renderTabs(path) {
  const router = createMemoryRouter(
    [{ path: '*', element: <TabsNav label="Secciones" tabs={TABS} /> }],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('TabsNav', () => {
  it('muestra una pestaña por ruta y marca la activa', () => {
    renderTabs('/dos');

    const nav = screen.getByRole('navigation', { name: 'Secciones' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Uno' })).toHaveAttribute('href', '/uno');
    expect(screen.getByRole('link', { name: 'Uno' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Dos' })).toHaveAttribute('aria-current', 'page');
  });
});
