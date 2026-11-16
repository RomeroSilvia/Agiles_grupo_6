import { describe, expect, it } from 'vitest';
import { ETIQUETA_OTRAS } from './administracion.constants.js';
import {
  agruparResto,
  aItemsPlataforma,
  aItemsRegion,
  calcularPorcentajesTipo,
} from './metricas.utils.js';

function crearItems(cantidades) {
  return cantidades.map((cantidad, indice) => ({
    clave: `item-${indice}`,
    etiqueta: `Item ${indice}`,
    cantidad,
  }));
}

describe('agruparResto', () => {
  it('deja la lista igual si no supera el máximo de filas', () => {
    const items = crearItems([5, 3, 1]);

    expect(agruparResto(items, 3)).toBe(items);
  });

  it('suma en «Otras» lo que no entra en el máximo de filas', () => {
    const resultado = agruparResto(crearItems([10, 8, 5, 2, 1]), 3);

    expect(resultado.map(({ etiqueta, cantidad }) => [etiqueta, cantidad])).toEqual([
      ['Item 0', 10],
      ['Item 1', 8],
      [ETIQUETA_OTRAS, 8],
    ]);
  });
});

describe('aItemsRegion', () => {
  it('usa el nombre de la región y deja el código si no lo conoce', () => {
    expect(
      aItemsRegion([
        { region: 'AR', cantidad: 4 },
        { region: 'NZ', cantidad: 1 },
      ]).map(({ etiqueta }) => etiqueta),
    ).toEqual(['Argentina', 'NZ']);
  });
});

describe('aItemsPlataforma', () => {
  it('completa nombre y logo con el catálogo y descarta las plataformas que no están', () => {
    const netflix = { id: 1, nombre: 'Netflix', logoPath: '/netflix.png' };

    expect(
      aItemsPlataforma(
        [
          { plataformaId: 1, cantidad: 9 },
          { plataformaId: 99, cantidad: 2 },
        ],
        new Map([[netflix.id, netflix]]),
      ),
    ).toEqual([{ clave: 1, etiqueta: 'Netflix', cantidad: 9, plataforma: netflix }]);
  });
});

describe('calcularPorcentajesTipo', () => {
  it('reparte el 100 % entre películas y series aunque redondee', () => {
    expect(
      calcularPorcentajesTipo([
        { tipo: 'pelicula', cantidad: 2 },
        { tipo: 'serie', cantidad: 1 },
      ]),
    ).toEqual([
      { tipo: 'pelicula', cantidad: 2, porcentaje: 67 },
      { tipo: 'serie', cantidad: 1, porcentaje: 33 },
    ]);
  });

  it('completa con 0 el tipo que no tiene datos', () => {
    expect(calcularPorcentajesTipo([{ tipo: 'serie', cantidad: 5 }])).toEqual([
      { tipo: 'pelicula', cantidad: 0, porcentaje: 0 },
      { tipo: 'serie', cantidad: 5, porcentaje: 100 },
    ]);
  });

  it('sin datos devuelve una lista vacía', () => {
    expect(calcularPorcentajesTipo([])).toEqual([]);
  });
});
