import { describe, it, expect } from 'vitest';
import { TIPO_OFERTA } from '@buscador/shared/constants';
import {
  columnasComparacion,
  contarRegionesConPropias,
  plataformasPorTipo,
} from './comparacion.js';

const NETFLIX = { plataforma: { id: 1, nombre: 'Netflix' }, esPropia: true };
const PRIME = { plataforma: { id: 2, nombre: 'Amazon Prime Video' }, esPropia: false };

const FILAS = [
  {
    region: 'AR',
    ofertas: [
      { tipoOferta: TIPO_OFERTA.COMPRA, plataformas: [PRIME] },
      { tipoOferta: TIPO_OFERTA.SUSCRIPCION, plataformas: [NETFLIX] },
    ],
  },
  { region: 'MX', ofertas: [{ tipoOferta: TIPO_OFERTA.ALQUILER, plataformas: [PRIME] }] },
  { region: 'CL', ofertas: [] },
];

describe('columnasComparacion', () => {
  it('devuelve los tipos de oferta presentes en el orden de las etiquetas', () => {
    expect(columnasComparacion(FILAS)).toEqual([
      TIPO_OFERTA.SUSCRIPCION,
      TIPO_OFERTA.ALQUILER,
      TIPO_OFERTA.COMPRA,
    ]);
  });

  it('muestra al menos la columna de suscripción si ninguna región tiene ofertas', () => {
    expect(columnasComparacion([{ region: 'CL', ofertas: [] }])).toEqual([TIPO_OFERTA.SUSCRIPCION]);
  });
});

describe('plataformasPorTipo', () => {
  it('devuelve las plataformas del tipo pedido o una lista vacía', () => {
    expect(plataformasPorTipo(FILAS[0].ofertas, TIPO_OFERTA.SUSCRIPCION)).toEqual([NETFLIX]);
    expect(plataformasPorTipo(FILAS[0].ofertas, TIPO_OFERTA.ALQUILER)).toEqual([]);
  });
});

describe('contarRegionesConPropias', () => {
  it('cuenta las regiones con al menos una plataforma propia', () => {
    expect(contarRegionesConPropias(FILAS)).toBe(1);
  });

  it('devuelve cero si ninguna región tiene plataformas propias', () => {
    expect(contarRegionesConPropias(FILAS.slice(1))).toBe(0);
  });
});
