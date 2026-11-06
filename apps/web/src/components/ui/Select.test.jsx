import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Select } from './Select.jsx';

function renderSelect(props) {
  return render(
    <Select aria-label="Género" defaultValue="" {...props}>
      <option value="">Todos</option>
      <option value="drama">Drama</option>
    </Select>,
  );
}

describe('Select', () => {
  it('muestra las opciones y avisa el cambio', () => {
    const onChange = vi.fn();
    renderSelect({ onChange });

    fireEvent.change(screen.getByRole('combobox', { name: 'Género' }), {
      target: { value: 'drama' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('option', { name: 'Drama' }).selected).toBe(true);
  });

  it('se puede deshabilitar', () => {
    renderSelect({ disabled: true });

    expect(screen.getByRole('combobox', { name: 'Género' })).toBeDisabled();
  });
});
