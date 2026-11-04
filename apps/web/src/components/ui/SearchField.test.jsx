import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchField } from './SearchField.jsx';

describe('SearchField', () => {
  it('es un campo de búsqueda por defecto', () => {
    render(<SearchField aria-label="Título" defaultValue="Dune" />);

    expect(screen.getByRole('searchbox', { name: 'Título' })).toHaveValue('Dune');
  });

  it('acepta otro tipo y rol, y no deja pisar sus clases', () => {
    render(<SearchField aria-label="Actor" type="text" role="combobox" className="w-10" />);

    const campo = screen.getByRole('combobox', { name: 'Actor' });
    expect(campo).toHaveAttribute('type', 'text');
    expect(campo).not.toHaveClass('w-10');
  });
});
