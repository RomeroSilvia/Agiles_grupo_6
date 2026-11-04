import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from './Alert.jsx';

describe('Alert', () => {
  it('anuncia el error y permite reintentar', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<Alert onRetry={onRetry}>No se pudo cargar</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar');

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('sin onRetry no muestra el botón y el tono info es un estado', () => {
    render(<Alert tone="info">No pudimos verificar todo</Alert>);

    expect(screen.getByRole('status')).toHaveTextContent('No pudimos verificar todo');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('el tono highlight también es un estado y no un error', () => {
    render(<Alert tone="highlight">Todavía no elegiste nada</Alert>);

    expect(screen.getByRole('status')).toHaveTextContent('Todavía no elegiste nada');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
