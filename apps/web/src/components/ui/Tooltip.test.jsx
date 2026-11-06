import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip } from './Tooltip.jsx';

describe('Tooltip', () => {
  it('describe al elemento que lo referencia', () => {
    render(
      <>
        <button type="button" aria-describedby="ayuda">
          Netflix
        </button>
        <Tooltip id="ayuda">No tenés Netflix en tus plataformas</Tooltip>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Netflix' })).toHaveAccessibleDescription(
      'No tenés Netflix en tus plataformas',
    );
  });

  it('decorativo no se anuncia, porque repite la etiqueta del elemento', () => {
    render(<Tooltip decorative>Ir a Netflix</Tooltip>);

    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
    expect(screen.getByText('Ir a Netflix')).toHaveAttribute('aria-hidden', 'true');
  });
});
