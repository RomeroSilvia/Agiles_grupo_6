import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { APP_NAME } from '../../config/app.config.js';
import { Logo } from './Logo.jsx';

describe('Logo', () => {
  it('muestra el ícono decorativo y el nombre', () => {
    const { container } = render(<Logo />);

    expect(screen.getByText(APP_NAME)).toBeVisible();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
