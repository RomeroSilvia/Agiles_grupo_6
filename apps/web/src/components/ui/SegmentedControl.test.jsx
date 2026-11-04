import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl.jsx';

const OPCIONES = [
  { value: '', label: 'Todos' },
  { value: 'pelicula', label: 'Películas' },
  { value: 'serie', label: 'Series' },
];

describe('SegmentedControl', () => {
  it('marca la opción actual y avisa el cambio con el nombre del campo', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedControl
        legend="Tipo"
        name="tipo"
        value=""
        options={OPCIONES}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('group', { name: 'Tipo' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Todos' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Series' }));

    const [evento] = onChange.mock.calls[0];
    expect(evento.target.name).toBe('tipo');
    expect(evento.target.value).toBe('serie');
  });

  it('no avisa si se elige la opción que ya está marcada', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedControl
        legend="Tipo"
        name="tipo"
        value="serie"
        options={OPCIONES}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Series' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
