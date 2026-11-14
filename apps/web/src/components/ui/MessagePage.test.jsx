import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MessagePage } from './MessagePage.jsx';

function renderMessagePage(props) {
  const router = createMemoryRouter([{ path: '*', element: <MessagePage {...props} /> }], {
    initialEntries: ['/cualquiera'],
  });
  render(<RouterProvider router={router} />);
}

describe('MessagePage', () => {
  it('muestra el título, la descripción y el enlace al inicio', () => {
    renderMessagePage({ titulo: 'Algo pasó', descripcion: 'Detalle del mensaje.' });

    expect(screen.getByRole('heading', { level: 1, name: 'Algo pasó' })).toBeInTheDocument();
    expect(screen.getByText('Detalle del mensaje.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });

  it('sin descripción muestra solo el título y el enlace', () => {
    renderMessagePage({ titulo: 'Algo pasó' });

    expect(screen.getByRole('heading', { level: 1, name: 'Algo pasó' })).toBeInTheDocument();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});
