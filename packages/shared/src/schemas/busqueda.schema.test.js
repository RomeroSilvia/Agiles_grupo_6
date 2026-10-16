import { describe, it, expect } from 'vitest';
import { busquedaPropiasSchema, busquedaSchema } from './busqueda.schema.js';

describe('busquedaSchema', () => {
  it('acepta identificadores enteros positivos para los filtros avanzados', () => {
    expect(
      busquedaSchema.parse({
        q: 'Dune',
        genero: '18',
        actor: '6193',
        director: '525',
      }),
    ).toMatchObject({ genero: 18, actor: 6193, director: 525, pagina: 1 });
  });

  it('permite omitir el título si se seleccionó otro filtro', () => {
    expect(busquedaSchema.parse({ genero: '18' })).toMatchObject({ q: '', genero: 18, pagina: 1 });
    expect(busquedaSchema.safeParse({}).success).toBe(false);
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
});
