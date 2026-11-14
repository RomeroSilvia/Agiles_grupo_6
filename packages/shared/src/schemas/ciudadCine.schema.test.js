import { describe, expect, it } from 'vitest';
import {
  ciudadCineIdSchema,
  ciudadCineSchema,
  listarCiudadesCineQuerySchema,
  respuestaCiudadesCineSchema,
} from './ciudadCine.schema.js';

const ciudad = {
  id: 'ar:550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Córdoba',
  provincia: 'Córdoba',
  pais: 'AR',
  zonaHoraria: 'America/Argentina/Cordoba',
  cobertura: 'disponible',
  fuente: {
    fuenteId: 'serpapi',
    registroId: 'cordoba',
    url: null,
    consultadoEn: '2026-11-13T10:00:00.000Z',
    actualizadoEn: null,
  },
};

describe('identificador de ciudad de cine', () => {
  it('acepta IDs opacos con prefijo argentino y UUID válido', () => {
    expect(ciudadCineIdSchema.parse(ciudad.id)).toBe(ciudad.id);
  });

  it('rechaza IDs sin prefijo o UUID válido', () => {
    expect(ciudadCineIdSchema.safeParse('AR').success).toBe(false);
    expect(ciudadCineIdSchema.safeParse('ar:550e8400-e29b-41d4-a716-44665544000z').success).toBe(
      false,
    );
  });
});

describe('contrato de ciudad de cine', () => {
  it('valida ciudad, provincia, zona horaria y referencia de procedencia', () => {
    expect(ciudadCineSchema.parse(ciudad)).toEqual(ciudad);
  });

  it('rechaza provincias ausentes y zonas horarias desconocidas', () => {
    expect(ciudadCineSchema.safeParse({ ...ciudad, provincia: '' }).success).toBe(false);
    expect(
      ciudadCineSchema.safeParse({ ...ciudad, zonaHoraria: 'America/Argentina/NoExiste' }).success,
    ).toBe(false);
    expect(ciudadCineSchema.safeParse({ ...ciudad, zonaHoraria: '-03:00' }).success).toBe(false);
  });

  it('rechaza países distintos de Argentina y coberturas desconocidas', () => {
    expect(ciudadCineSchema.safeParse({ ...ciudad, pais: 'CL' }).success).toBe(false);
    expect(ciudadCineSchema.safeParse({ ...ciudad, cobertura: 'probable' }).success).toBe(false);
    expect(
      ciudadCineSchema.safeParse({ ...ciudad, serpApiLocation: 'Córdoba,Argentina' }).success,
    ).toBe(false);
  });
});

describe('respuesta del directorio de ciudades', () => {
  it('valida el contrato público y rechaza campos adicionales', () => {
    expect(respuestaCiudadesCineSchema.parse({ pais: 'AR', ciudades: [ciudad] })).toEqual({
      pais: 'AR',
      ciudades: [ciudad],
    });
    expect(listarCiudadesCineQuerySchema.safeParse({ extra: 'no permitido' }).success).toBe(false);
  });
});
