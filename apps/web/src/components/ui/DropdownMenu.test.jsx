import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { DropdownMenu } from './DropdownMenu.jsx';
import { DropdownMenuItem } from './DropdownMenuItem.jsx';

function renderMenu({ onSalir = vi.fn() } = {}) {
  render(
    <MemoryRouter>
      <p>Afuera</p>
      <DropdownMenu label="Opciones" trigger={<span>A</span>}>
        <DropdownMenuItem to="/perfil">Perfil</DropdownMenuItem>
        <DropdownMenuItem onClick={onSalir}>Salir</DropdownMenuItem>
      </DropdownMenu>
    </MemoryRouter>,
  );
  return { onSalir, boton: screen.getByRole('button', { name: 'Opciones' }) };
}

describe('DropdownMenu', () => {
  it('arranca cerrado y al hacer click muestra las opciones con foco en la primera', async () => {
    const user = userEvent.setup();
    const { boton } = renderMenu();

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Perfil' })).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Salir' })).toBeInTheDocument();
  });

  it('se recorre con las flechas', async () => {
    const user = userEvent.setup();
    const { boton } = renderMenu();

    await user.click(boton);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Salir' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Perfil' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Salir' })).toHaveFocus();
  });

  it('se cierra con Escape y devuelve el foco al botón', async () => {
    const user = userEvent.setup();
    const { boton } = renderMenu();

    await user.click(boton);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(boton).toHaveFocus();
  });

  it('se cierra al hacer click afuera', async () => {
    const user = userEvent.setup();
    const { boton } = renderMenu();

    await user.click(boton);
    await user.click(screen.getByText('Afuera'));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('al elegir una opción ejecuta su acción y se cierra', async () => {
    const user = userEvent.setup();
    const { boton, onSalir } = renderMenu();

    await user.click(boton);
    await user.click(screen.getByRole('menuitem', { name: 'Salir' }));

    expect(onSalir).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
