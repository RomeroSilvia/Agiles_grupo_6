import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionTitle } from './SectionTitle.jsx';

describe('SectionTitle', () => {
  it('es un h2 por defecto y pasa los atributos', () => {
    render(<SectionTitle id="sinopsis">Sinopsis</SectionTitle>);

    expect(screen.getByRole('heading', { level: 2, name: 'Sinopsis' })).toHaveAttribute(
      'id',
      'sinopsis',
    );
  });

  it('permite cambiar el nivel y el tamaño sin perder las clases propias', () => {
    render(
      <SectionTitle as="h3" size="card" className="line-clamp-2">
        Dune
      </SectionTitle>,
    );

    const titulo = screen.getByRole('heading', { level: 3, name: 'Dune' });
    expect(titulo).toHaveClass('text-base', 'line-clamp-2');
    expect(titulo).not.toHaveClass('text-xl');
  });
});
