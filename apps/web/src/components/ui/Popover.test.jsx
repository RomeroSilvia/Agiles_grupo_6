import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover } from './Popover.jsx';

function renderPopover() {
  return render(
    <>
      <Popover label="Regiones" trigger="Agregar región">
        <input type="checkbox" aria-label="Chile (CL)" />
      </Popover>
      <button type="button">Afuera</button>
    </>,
  );
}

describe('Popover', () => {
  it('abre y cierra el panel desde el botón', async () => {
    const user = userEvent.setup();
    renderPopover();

    const boton = screen.getByRole('button', { name: 'Agregar región' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'Regiones' })).not.toBeInTheDocument();

    await user.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('checkbox', { name: 'Chile (CL)' })).toBeInTheDocument();
  });

  it('se cierra con Escape y devuelve el foco al botón', async () => {
    const user = userEvent.setup();
    renderPopover();

    const boton = screen.getByRole('button', { name: 'Agregar región' });
    await user.click(boton);
    await user.keyboard('{Escape}');

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(boton).toHaveFocus();
  });

  it('se cierra al hacer clic afuera', async () => {
    const user = userEvent.setup();
    renderPopover();

    await user.click(screen.getByRole('button', { name: 'Agregar región' }));
    await user.click(screen.getByRole('button', { name: 'Afuera' }));

    expect(screen.getByRole('button', { name: 'Agregar región' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
