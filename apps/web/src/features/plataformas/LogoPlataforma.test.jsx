import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TMDB_LOGO_BASE_URL } from '@buscador/shared/constants';
import { LogoPlataforma } from './LogoPlataforma.jsx';

const NETFLIX = { id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: null };

describe('LogoPlataforma', () => {
  it('sin logo muestra la inicial con el color de la plataforma', () => {
    render(<LogoPlataforma plataforma={NETFLIX} />);

    const inicial = screen.getByText('N');
    expect(inicial).toHaveAttribute('data-plataforma', '8');
  });

  it('con logo muestra la imagen de TMDB', () => {
    render(<LogoPlataforma plataforma={{ ...NETFLIX, logoPath: '/netflix.jpg' }} />);

    expect(screen.getByRole('img', { name: 'Logo de Netflix' })).toHaveAttribute(
      'src',
      `${TMDB_LOGO_BASE_URL}/netflix.jpg`,
    );
  });

  it('si la imagen no carga vuelve a la inicial', () => {
    render(<LogoPlataforma plataforma={{ ...NETFLIX, logoPath: '/netflix.jpg' }} />);

    fireEvent.error(screen.getByRole('img', { name: 'Logo de Netflix' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('N')).toHaveAttribute('data-plataforma', '8');
  });

  it('usa el tamaño pequeño y conserva la inicial si falla el logo', () => {
    render(<LogoPlataforma plataforma={{ ...NETFLIX, logoPath: '/netflix.jpg' }} size="small" />);

    const logo = screen.getByRole('img', { name: 'Logo de Netflix' });
    expect(logo).toHaveClass('size-6');
    fireEvent.error(logo);
    expect(screen.getByText('N')).toHaveClass('size-6');
  });
});
