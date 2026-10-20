import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as icons from './icons.jsx';

const ICONOS = Object.entries(icons);

describe('icons', () => {
  it.each(ICONOS)('%s es decorativo, mide size-5 y hereda el color del texto', (_, Icono) => {
    const { container } = render(<Icono />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveClass('size-5');
  });

  it.each(ICONOS)('%s reemplaza el tamaño por el className recibido', (_, Icono) => {
    const { container } = render(<Icono className="size-4" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveClass('size-4');
    expect(svg).not.toHaveClass('size-5');
  });

  it('pasa al svg los props que recibe', () => {
    render(<icons.CheckIcon data-testid="icono" />);

    expect(screen.getByTestId('icono').tagName.toLowerCase()).toBe('svg');
  });

  it('el spinner sigue girando aunque reciba otro className', () => {
    const { container } = render(<icons.SpinnerIcon className="size-4" />);

    expect(container.querySelector('svg')).toHaveClass('animate-spin', 'size-4');
  });

  it('no suma texto al nombre accesible del botón que lo contiene', () => {
    render(
      <button type="button" aria-label="Cerrar menú">
        <icons.XIcon />
      </button>,
    );

    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toBeInTheDocument();
  });
});
