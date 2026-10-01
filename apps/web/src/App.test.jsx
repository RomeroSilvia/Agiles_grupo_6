import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.jsx';

describe('App', () => {
  it('muestra la pantalla de búsqueda', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Encontrá qué ver' })).toBeInTheDocument();
  });
});
