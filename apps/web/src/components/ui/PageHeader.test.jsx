import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader.jsx';

describe('PageHeader', () => {
  it('muestra el título principal y la descripción', () => {
    render(<PageHeader titulo="Mi perfil" descripcion="Tus datos" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeInTheDocument();
    expect(screen.getByText('Tus datos')).toBeInTheDocument();
  });

  it('sin descripción solo muestra el título', () => {
    const { container } = render(<PageHeader titulo="Mi perfil" />);

    expect(container.querySelector('p')).not.toBeInTheDocument();
  });
});
