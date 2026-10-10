import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo.jsx';

describe('Logo', () => {
  it('muestra el ícono decorativo y el nombre', () => {
    const { container } = render(<Logo />);

    expect(screen.getByText('STREAMLY')).toBeVisible();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
