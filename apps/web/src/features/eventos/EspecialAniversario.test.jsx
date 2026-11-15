import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { EspecialAniversario } from './EspecialAniversario.jsx';

afterEach(() => vi.useRealTimers());

describe('especial por el aniversario de La Plata', () => {
  it.each([
    ['2026-11-19T02:59:59Z', 'Se viene una semana'],
    ['2026-11-19T03:00:00Z', 'Una semana'],
    ['2026-11-26T02:59:59Z', 'Una semana'],
  ])('anuncia las fechas del especial y respeta el día argentino en %s', (ahora, texto) => {
    vi.useFakeTimers();
    vi.setSystemTime(ahora);
    render(<EspecialAniversario />);
    expect(screen.getByRole('complementary')).toHaveTextContent(
      'Evento especial · 144.º aniversario de La Plata',
    );
    expect(screen.getByRole('complementary')).toHaveTextContent(texto);
    expect(screen.getByRole('complementary')).toHaveTextContent(
      'Del 19 al 25 de noviembre de 2026 · Solo por una semana',
    );
  });
  it('retira la promoción al terminar los siete días aunque la página siga abierta', () => {
    vi.useFakeTimers();
    vi.setSystemTime('2026-11-26T02:59:59Z');
    render(<EspecialAniversario />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
  it('activa el especial al llegar la medianoche local sin recargar', () => {
    vi.useFakeTimers();
    vi.setSystemTime('2026-11-19T02:59:59Z');
    render(<EspecialAniversario />);
    expect(screen.getByText(/Se viene una semana/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText(/^Una semana/)).toBeInTheDocument();
  });
  it('no anuncia como vigente un aniversario que ya terminó', () => {
    vi.useFakeTimers();
    vi.setSystemTime('2026-11-26T03:00:00Z');
    render(<EspecialAniversario />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
