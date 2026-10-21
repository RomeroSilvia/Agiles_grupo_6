import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button.jsx';

describe('Button', () => {
  it('es de tipo button y avisa el clic', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Guardar</Button>);

    const boton = screen.getByRole('button', { name: 'Guardar' });
    expect(boton).toHaveAttribute('type', 'button');

    await user.click(boton);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('mientras carga queda deshabilitado, ocupado y muestra el texto de carga', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button variant="outline" size="compact" loading loadingText="Cargando…" onClick={onClick}>
        Cargar más
      </Button>,
    );

    const boton = screen.getByRole('button', { name: 'Cargando…' });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');

    await user.click(boton);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('deshabilitado sin cargar conserva su texto y no avisa el clic', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button variant="outlineDanger" disabled onClick={onClick}>
        Reintentar
      </Button>,
    );

    const boton = screen.getByRole('button', { name: 'Reintentar' });
    expect(boton).toBeDisabled();
    expect(boton).not.toHaveAttribute('aria-busy');

    await user.click(boton);

    expect(onClick).not.toHaveBeenCalled();
  });
});
