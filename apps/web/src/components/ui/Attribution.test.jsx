import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Attribution, AttributionDisponibilidad } from './Attribution.jsx';

describe('Attribution (E6HU3)', () => {
  it('muestra la atribución visible a TMDB y JustWatch con enlaces válidos', () => {
    render(<Attribution />);

    const linkTmdb = screen.getByRole('link', { name: 'TMDB' });
    expect(linkTmdb).toHaveAttribute('href', 'https://www.themoviedb.org');
    expect(linkTmdb).toHaveAttribute('target', '_blank');
    expect(linkTmdb).toHaveAttribute('rel', 'noreferrer');

    const linkJustWatch = screen.getByRole('link', { name: 'JustWatch' });
    expect(linkJustWatch).toHaveAttribute('href', 'https://www.justwatch.com');
    expect(linkJustWatch).toHaveAttribute('target', '_blank');
    expect(linkJustWatch).toHaveAttribute('rel', 'noreferrer');

    expect(screen.getByText(/Datos de títulos provistos por/i)).toBeInTheDocument();
    expect(screen.getByText(/datos de disponibilidad provistos por/i)).toBeInTheDocument();
    expect(screen.getByText(/no está avalado ni certificado por TMDB/i)).toBeInTheDocument();
  });
});

describe('AttributionDisponibilidad (E6HU3)', () => {
  it('muestra el enlace a JustWatch como fuente de datos de disponibilidad', () => {
    render(<AttributionDisponibilidad />);

    const linkJustWatch = screen.getByRole('link', { name: 'JustWatch' });
    expect(linkJustWatch).toHaveAttribute('href', 'https://www.justwatch.com');
    expect(linkJustWatch).toHaveAttribute('target', '_blank');
    expect(linkJustWatch).toHaveAttribute('rel', 'noreferrer');

    expect(screen.getByText(/Datos de disponibilidad provistos por/i)).toBeInTheDocument();
  });
});
