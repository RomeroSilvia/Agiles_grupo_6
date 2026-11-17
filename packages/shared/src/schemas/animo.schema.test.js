import { describe, it, expect } from 'vitest';
import { ESTADOS_ANIMO, ESTADOS_ANIMO_IDS } from '../constants/index.js';
import { busquedaAnimoSchema } from './animo.schema.js';

describe('ESTADOS_ANIMO', () => {
  it('tiene la lista fija de cinco estados de ánimo', () => {
    expect(ESTADOS_ANIMO.map(({ nombre }) => nombre)).toEqual([
      'Para reír',
      'Algo liviano',
      'Para pensar',
      'Con tensión',
      'Para emocionarme',
    ]);
    expect(new Set(ESTADOS_ANIMO_IDS).size).toBe(ESTADOS_ANIMO.length);
  });
});

describe('busquedaAnimoSchema', () => {
  it('acepta un estado de la lista y convierte la página a número', () => {
    expect(busquedaAnimoSchema.parse({ animo: 'para-reir', pagina: '2' })).toEqual({
      animo: 'para-reir',
      pagina: 2,
    });
  });

  it('usa la primera página si no se indica', () => {
    expect(busquedaAnimoSchema.parse({ animo: 'con-tension' }).pagina).toBe(1);
  });

  it.each([undefined, '', 'aburrido', 'Para reír'])('rechaza el estado de ánimo %s', (animo) => {
    const resultado = busquedaAnimoSchema.safeParse({ animo });

    expect(resultado.success).toBe(false);
    expect(resultado.error.issues[0].message).toBe('Elegí un estado de ánimo de la lista');
  });

  it('rechaza una página inválida o parámetros desconocidos', () => {
    expect(busquedaAnimoSchema.safeParse({ animo: 'para-reir', pagina: '0' }).success).toBe(false);
    expect(busquedaAnimoSchema.safeParse({ animo: 'para-reir', genero: 'drama' }).success).toBe(
      false,
    );
  });
});
