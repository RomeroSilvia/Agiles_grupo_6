import { describe, it, expect } from 'vitest';
import {
  comparacionDisponibilidadQuerySchema,
  regionesComparacionSchema,
  regionSoportadaSchema,
} from './region.schema.js';

describe('regionSoportadaSchema', () => {
  it('acepta códigos de región soportados', () => {
    expect(regionSoportadaSchema.parse('AR')).toBe('AR');
    expect(regionSoportadaSchema.parse('US')).toBe('US');
  });

  it('rechaza códigos no soportados o mal formados', () => {
    expect(regionSoportadaSchema.safeParse('ZZ').success).toBe(false);
    expect(regionSoportadaSchema.safeParse('argentina').success).toBe(false);
  });
});

describe('regionesComparacionSchema', () => {
  it('acepta una lista separada por comas y deduplica regiones repetidas', () => {
    expect(regionesComparacionSchema.parse('US, ES, US')).toEqual(['US', 'ES']);
  });

  it('acepta un arreglo de códigos válidos', () => {
    expect(regionesComparacionSchema.parse(['BR', 'MX'])).toEqual(['BR', 'MX']);
  });

  it('rechaza cuando no se envía ninguna región', () => {
    expect(regionesComparacionSchema.safeParse('').success).toBe(false);
    expect(regionesComparacionSchema.safeParse([]).success).toBe(false);
  });

  it('rechaza cuando supera el máximo de regiones permitido', () => {
    const resultado = regionesComparacionSchema.safeParse('AR,BR,CL,CO,MX,US');
    expect(resultado.success).toBe(false);
  });

  it('rechaza códigos que no están en la lista soportada', () => {
    const resultado = comparacionDisponibilidadQuerySchema.safeParse({ regiones: 'US,ZZ' });
    expect(resultado.success).toBe(false);
  });
});
