import { describe, expect, it } from 'vitest';
import { formatearFechaCivil, formatearFechaCorta } from './formatearFecha.js';

describe('formatearFecha', () => {
  it('formatea una fecha civil sin correrse de día', () => {
    expect(formatearFechaCivil('2024-02-29')).toBe('29 de febrero de 2024');
  });

  it('formatea una fecha corta como dd/mm/aaaa', () => {
    expect(formatearFechaCorta(new Date(2026, 9, 12, 15, 30))).toBe('12/10/2026');
  });
});
