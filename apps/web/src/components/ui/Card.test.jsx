import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card.jsx';

describe('Card', () => {
  it('renderiza el elemento pedido y le pasa los atributos', () => {
    render(
      <Card as="section" aria-label="Datos de la cuenta">
        Contenido
      </Card>,
    );

    expect(screen.getByRole('region', { name: 'Datos de la cuenta' })).toHaveTextContent(
      'Contenido',
    );
  });

  it('sin as es un div y suma el tono y el padding pedidos', () => {
    render(
      <Card tone="danger" padding="none" data-testid="tarjeta">
        Contenido
      </Card>,
    );

    const tarjeta = screen.getByTestId('tarjeta');
    expect(tarjeta.tagName).toBe('DIV');
    expect(tarjeta).toHaveClass('bg-danger-surface');
    expect(tarjeta).not.toHaveClass('p-4');
  });
});
