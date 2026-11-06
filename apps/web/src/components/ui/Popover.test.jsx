import { describe, it, expect, vi } from 'vitest';
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

  it('controlado respeta open y avisa los cambios sin cambiar solo', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Popover label="Regiones" trigger="Agregar región" open={false} onOpenChange={onOpenChange}>
        <input type="checkbox" aria-label="Chile (CL)" />
      </Popover>,
    );

    const boton = screen.getByRole('button', { name: 'Agregar región' });
    await user.click(boton);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('por defecto se ancla al botón y con anchor="parent" deja el anclaje al contenedor', () => {
    const { rerender } = render(
      <Popover label="Regiones" trigger="Agregar región">
        Opciones
      </Popover>,
    );

    const contenedor = () => screen.getByRole('button', { name: 'Agregar región' }).parentElement;
    expect(contenedor()).toHaveClass('relative');

    rerender(
      <Popover label="Regiones" trigger="Agregar región" anchor="parent">
        Opciones
      </Popover>,
    );

    expect(contenedor()).not.toHaveClass('relative');
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
