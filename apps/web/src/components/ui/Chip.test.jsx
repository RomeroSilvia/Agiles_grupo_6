import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip.jsx';

describe('Chip', () => {
  it('permite quitarlo con un botón con nombre propio', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <Chip onRemove={onRemove} removeLabel="Quitar Serie">
        Serie
      </Chip>,
    );

    await user.click(screen.getByRole('button', { name: 'Quitar Serie' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('sin onRemove es solo una etiqueta', () => {
    render(<Chip>Película</Chip>);

    expect(screen.getByText('Película')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
