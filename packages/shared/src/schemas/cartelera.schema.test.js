import { describe, expect, it } from 'vitest';
import {
  consultaCarteleraSchema,
  peliculaCarteleraSchema,
  fuenteCarteleraSchema,
  fuenteSchema,
} from './cartelera.schema.js';

const fuente = {
  fuenteId: 'tmdb',
  registroId: '123',
  url: null,
  consultadoEn: '2026-11-13T23:00:00.000Z',
  actualizadoEn: null,
};

const pelicula = {
  tmdbId: 123,
  tipo: 'pelicula',
  nombre: null,
  posterUrl: null,
  anio: null,
  puntuacion: null,
  region: 'AR',
  estadoExhibicion: 'cartelera_proveedor',
  fechaEstrenoAr: '2024-02-29',
  estadoFecha: 'informada',
  fuente,
};

describe('esquema de cartelera', () => {
  it('valida una película con metadatos opcionales nulos y fecha civil', () => {
    expect(peliculaCarteleraSchema.parse(pelicula)).toEqual(pelicula);
  });

  it('rechaza fecha imposible, serie y región distinta de AR', () => {
    expect(
      peliculaCarteleraSchema.safeParse({ ...pelicula, fechaEstrenoAr: '2025-02-29' }).success,
    ).toBe(false);
    expect(peliculaCarteleraSchema.safeParse({ ...pelicula, tipo: 'serie' }).success).toBe(false);
    expect(peliculaCarteleraSchema.safeParse({ ...pelicula, region: 'CL' }).success).toBe(false);
  });

  it('valida la fuente y requiere timestamp UTC con Z', () => {
    expect(fuenteCarteleraSchema.safeParse(fuente).success).toBe(true);
    expect(fuenteSchema.safeParse({ ...fuente, fuenteId: 'butaca' }).success).toBe(true);
    expect(fuenteSchema.safeParse({ ...fuente, fuenteId: '' }).success).toBe(false);
    expect(fuenteCarteleraSchema.safeParse({ ...fuente, fuenteId: 'butaca' }).success).toBe(false);
    expect(
      fuenteCarteleraSchema.safeParse({
        ...fuente,
        consultadoEn: '2026-11-13T20:00:00-03:00',
      }).success,
    ).toBe(false);
  });

  it('acepta página por defecto y rechaza valores vacíos, arrays y claves adicionales', () => {
    expect(consultaCarteleraSchema.parse({})).toEqual({ pagina: 1 });
    expect(consultaCarteleraSchema.parse({ pagina: '2' })).toEqual({ pagina: 2 });
    for (const query of [
      { pagina: '' },
      { pagina: '1.2' },
      { pagina: ['1', '2'] },
      { pagina: '501' },
      { pagina: '1', region: 'CL' },
    ]) {
      expect(consultaCarteleraSchema.safeParse(query).success).toBe(false);
    }
  });
});
