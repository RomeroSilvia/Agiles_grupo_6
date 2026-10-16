import { describe, it, expect } from 'vitest';
import { busquedaSchema } from './busqueda.schema.js';

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

  it.each(['', '0', '-1', '1.5', '1e2', '2147483648', 'invalido'])(
    'rechaza el identificador %j',
    (identificador) => {
      expect(busquedaSchema.safeParse({ q: 'Dune', actor: identificador }).success).toBe(false);
    },
  );
});
