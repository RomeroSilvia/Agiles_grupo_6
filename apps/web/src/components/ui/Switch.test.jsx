import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch.jsx';

describe('Switch', () => {
  it('muestra su estado y avisa el valor nuevo al hacer clic', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch checked={false} onChange={onChange} label="Netflix" />);

    const control = screen.getByRole('switch', { name: 'Netflix' });
    expect(control).toHaveAttribute('aria-checked', 'false');

    await user.click(control);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('avisa false al apagarlo', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch checked onChange={onChange} label="Netflix" />);

    await user.click(screen.getByRole('switch', { name: 'Netflix' }));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('no cambia si está deshabilitado', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch checked={false} onChange={onChange} label="Netflix" disabled />);

    await user.click(screen.getByRole('switch', { name: 'Netflix' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
