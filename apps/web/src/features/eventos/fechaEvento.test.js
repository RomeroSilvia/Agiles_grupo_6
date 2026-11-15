import { describe, expect, it } from 'vitest';
import { formatearFechaEvento } from './fechaEvento.js';

describe('fechas de eventos', () => {
  it('muestra una fecha civil sin desplazarla por la zona del navegador', () => {
    expect(formatearFechaEvento({ fecha: '2026-11-25' })).toBe('25 de noviembre de 2026');
  });
  it('muestra los horarios informados en la zona de La Plata', () => {
    expect(formatearFechaEvento({ inicio: '2026-11-26T01:00:00Z' })).toContain(
      '25 de noviembre de 2026',
    );
    expect(formatearFechaEvento({ inicio: '2026-11-26T01:00:00Z' })).toContain('22:00');
  });
  it('traduce etiquetas sin asignar un año ausente y ofrece un texto si falta la fecha', () => {
    expect(formatearFechaEvento({ fechaTexto: 'Wed, 25 Nov • 08:00 PM' })).toBe(
      'Mié, 25 nov • 08:00 PM',
    );
    expect(formatearFechaEvento({})).toBe('Fecha y horario a confirmar');
  });
});
