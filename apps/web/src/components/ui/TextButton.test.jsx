import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextButton } from './TextButton.jsx';

describe('TextButton', () => {
  it('es de tipo button y avisa el clic', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<TextButton onClick={onClick}>Reintentar</TextButton>);

    const boton = screen.getByRole('button', { name: 'Reintentar' });
    expect(boton).toHaveAttribute('type', 'button');

    await user.click(boton);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no avisa el clic si está deshabilitado', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <TextButton onClick={onClick} disabled>
        Reintentar
      </TextButton>,
    );

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
