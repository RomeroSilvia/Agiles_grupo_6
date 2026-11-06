import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TarjetaDisponibilidad } from './TarjetaDisponibilidad.jsx';

const NETFLIX = { id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: null, urlHome: null };

describe('TarjetaDisponibilidad', () => {
  it('con plataforma propia y destino válido enlaza a la plataforma', () => {
    render(
      <TarjetaDisponibilidad
        plataforma={{ ...NETFLIX, urlHome: 'https://www.netflix.com' }}
        esPropia
      />,
    );

    expect(screen.getByRole('link', { name: 'Ir a Netflix' })).toHaveAttribute(
      'href',
      'https://www.netflix.com',
    );
  });

  it('sin destino no enlaza, pero nombra la plataforma y se puede enfocar', () => {
    render(<TarjetaDisponibilidad plataforma={NETFLIX} esPropia />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Netflix' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('Disponible en Netflix')).toBeInTheDocument();
  });
});
