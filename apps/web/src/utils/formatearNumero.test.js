import { describe, expect, it } from 'vitest';
import { formatearNumero } from './formatearNumero.js';

describe('formatearNumero', () => {
  it('separa los miles con punto', () => {
    expect(formatearNumero(1284)).toBe('1.284');
  });
});
