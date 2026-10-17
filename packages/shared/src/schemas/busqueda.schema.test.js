import { describe, it, expect } from 'vitest';
import {
  busquedaPropiasSchema,
  busquedaSchema,
  personaBusquedaSchema,
  personaIdBusquedaSchema,
  tieneFiltrosAvanzados,
} from './busqueda.schema.js';

describe('busquedaSchema', () => {
  it('acepta géneros unificados e identificadores positivos para las personas', () => {
    expect(
      busquedaSchema.parse({
        q: 'Dune',
        genero: 'fantasia-ciencia-ficcion',
        actor: '6193',
        director: '525',
      }),
    ).toMatchObject({ genero: 'fantasia-ciencia-ficcion', actor: 6193, director: 525, pagina: 1 });
  });

  it('permite omitir el título si se seleccionó otro filtro', () => {
    expect(busquedaSchema.parse({ genero: 'drama' })).toMatchObject({
      q: '',
      genero: 'drama',
      pagina: 1,
    });
    expect(busquedaSchema.safeParse({}).success).toBe(false);
  });

  it('rechaza identificadores TMDB como género y parámetros desconocidos', () => {
    expect(busquedaSchema.safeParse({ q: 'Dune', genero: '18' }).success).toBe(false);
    expect(busquedaSchema.safeParse({ q: 'Dune', actorNombre: 'Leonardo' }).success).toBe(false);
  });

  it('permite omitir el título en la búsqueda por plataformas propias', () => {
    expect(busquedaPropiasSchema.parse({})).toMatchObject({ q: '', pagina: 1 });
  });

  it.each(['', '0', '-1', '1.5', '1e2', '2147483648', 'invalido'])(
    'rechaza el identificador %j',
    (identificador) => {
      expect(busquedaSchema.safeParse({ q: 'Dune', actor: identificador }).success).toBe(false);
    },
  );

  it('valida búsquedas y referencias de personas con el mismo rol compartido', () => {
    expect(personaBusquedaSchema.parse({ q: '  Leo ', rol: 'actor' })).toEqual({
      q: 'Leo',
      rol: 'actor',
    });
    expect(personaBusquedaSchema.safeParse({ q: 'L', rol: 'actor' }).success).toBe(false);
    expect(personaBusquedaSchema.safeParse({ q: 'Leo', rol: 'guionista' }).success).toBe(false);
    expect(personaIdBusquedaSchema.parse({ id: '6193', rol: 'actor' }).id).toBe(6193);
  });

  it('identifica filtros avanzados desde la función compartida', () => {
    expect(tieneFiltrosAvanzados({ genero: 'drama' })).toBe(true);
    expect(tieneFiltrosAvanzados({ tipo: 'pelicula' })).toBe(false);
  });
});
