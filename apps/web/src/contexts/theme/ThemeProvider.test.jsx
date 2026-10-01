import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeProvider', () => {
  it('arranca en modo claro si no hay preferencia guardada', () => {
    renderWithTheme();
    expect(document.documentElement).not.toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Activar modo oscuro' })).toBeInTheDocument();
  });

  it('alterna a modo oscuro y lo recuerda', () => {
    renderWithTheme();

    fireEvent.click(screen.getByRole('button', { name: 'Activar modo oscuro' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('respeta la preferencia guardada', () => {
    localStorage.setItem('theme', 'dark');
    renderWithTheme();
    expect(document.documentElement).toHaveClass('dark');
  });
});
