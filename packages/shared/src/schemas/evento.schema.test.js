import { describe, expect, it } from 'vitest';
import { consultaEventosSchema, enlaceEventoSchema, imagenEventoSchema } from './evento.schema.js';

describe('contratos de eventos', () => {
  it('ofrece próximos eventos y valida una consulta por fecha o categoría', () => {
    expect(consultaEventosSchema.parse({})).toEqual({
      categoria: 'todas',
      fecha: 'todas',
      pagina: 1,
    });
    expect(consultaEventosSchema.parse({ categoria: 'teatro', pagina: '2' }).pagina).toBe(2);
    expect(consultaEventosSchema.safeParse({ fecha: 'fin_de_semana' }).success).toBe(true);
  });
  it.each([
    { ciudad: 'Rosario' },
    { categoria: 'inexistente' },
    { pagina: 6 },
    { categoria: 'music' },
    { categoria: 'musica', fecha: 'hoy' },
  ])('rechaza parámetros fuera del alcance: %j', (params) => {
    expect(consultaEventosSchema.safeParse(params).success).toBe(false);
  });
  it.each([
    'javascript:alert(1)',
    'https://allevents.in.ejemplo.com/la-plata/fiesta/1',
    'https://allevents.in/buenos-aires/fiesta/1',
    'https://usuario@allevents.in/la-plata/fiesta/1',
    'https://allevents.in/la-plata/fiesta/1?token=privado',
  ])('rechaza enlaces ajenos a publicaciones seguras de La Plata: %s', (url) => {
    expect(enlaceEventoSchema.safeParse(url).success).toBe(false);
  });
  it('admite enlaces e imágenes del proveedor', () => {
    expect(enlaceEventoSchema.safeParse('https://allevents.in/la-plata/teatro/123').success).toBe(
      true,
    );
    expect(
      imagenEventoSchema.safeParse('https://cdn-az.allevents.in/events/imagen.jpg').success,
    ).toBe(true);
    expect(imagenEventoSchema.safeParse('https://otro.example/imagen.jpg').success).toBe(false);
  });
});
