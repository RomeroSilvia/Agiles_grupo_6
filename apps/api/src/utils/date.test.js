import { describe, it, expect } from 'vitest';
import { getUtcDayWindow, parseYear } from './date.js';

describe('getUtcDayWindow', () => {
  it('devuelve el día UTC que contiene la fecha', () => {
    expect(getUtcDayWindow('2026-11-15T23:30:00-03:00')).toEqual({
      start: '2026-11-16T00:00:00.000Z',
      end: '2026-11-17T00:00:00.000Z',
    });
  });
});

describe('parseYear', () => {
  it('extrae el año de una fecha ISO', () => {
    expect(parseYear('2021-09-15')).toBe(2021);
  });

  it.each([null, undefined, '', 'sin-fecha'])(
    'devuelve null si no hay año válido (%s)',
    (valor) => {
      expect(parseYear(valor)).toBeNull();
    },
  );
});
