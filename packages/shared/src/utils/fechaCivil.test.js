import { describe, it, expect } from 'vitest';
import { obtenerFechaCivil, obtenerHoyArgentina, sumarDiasCivil } from './fechaCivil.js';

describe('fechaCivil', () => {
  it('devuelve la fecha civil en la zona horaria indicada', () => {
    const instante = '2026-11-16T01:30:00Z';
    expect(obtenerFechaCivil(instante, 'America/Argentina/Buenos_Aires')).toBe('2026-11-15');
    expect(obtenerFechaCivil(instante, 'UTC')).toBe('2026-11-16');
  });

  it('usa la hora de Argentina para el día de hoy', () => {
    expect(obtenerHoyArgentina(new Date('2026-11-16T02:59:00Z'))).toBe('2026-11-15');
    expect(obtenerHoyArgentina(new Date('2026-11-16T03:00:00Z'))).toBe('2026-11-16');
  });

  it('suma días respetando el cambio de mes y de año', () => {
    expect(sumarDiasCivil('2026-11-30', 1)).toBe('2026-12-01');
    expect(sumarDiasCivil('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDiasCivil('2026-03-01', -1)).toBe('2026-02-28');
  });
});
