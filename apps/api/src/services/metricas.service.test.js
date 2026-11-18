import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GENEROS_BUSQUEDA,
  MIN_CANTIDAD_TEXTO_BUSCADO,
  PERIODO_METRICAS,
} from '@buscador/shared/constants';
import * as metricasRepository from '../repositories/metricas.repository.js';
import { calcularDesde, obtenerMetricas } from './metricas.service.js';

vi.mock('../repositories/metricas.repository.js', () => ({ obtenerMetricas: vi.fn() }));

const AHORA = new Date('2026-11-16T12:00:00.000Z');

const TOTALES = {
  usuarios: 10,
  usuariosNuevos: 2,
  titulosWatchlist: 30,
  titulosWatchlistNuevos: 5,
  regionesActivas: 3,
  plataformasElegidas: 4,
};

function metricasDelRepository(cambios = {}) {
  return {
    totales: TOTALES,
    rankings: {
      genero: { watchlist: [], busquedas: [] },
      tipo: { watchlist: [], busquedas: [] },
      region: { watchlist: [], busquedas: [] },
      plataforma: [],
      textosBuscados: [],
      ...cambios,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  metricasRepository.obtenerMetricas.mockResolvedValue(metricasDelRepository());
});

describe('calcularDesde', () => {
  it('resta los días de cada período a la fecha actual', () => {
    expect(calcularDesde(PERIODO_METRICAS.SIETE_DIAS, AHORA)).toBe('2026-11-09T12:00:00.000Z');
    expect(calcularDesde(PERIODO_METRICAS.TREINTA_DIAS, AHORA)).toBe('2026-10-17T12:00:00.000Z');
  });

  it('devuelve null para todo el período', () => {
    expect(calcularDesde(PERIODO_METRICAS.TODO, AHORA)).toBeNull();
  });
});

describe('obtenerMetricas', () => {
  it('pide las métricas desde el inicio del período con los géneros de la app', async () => {
    await obtenerMetricas(PERIODO_METRICAS.SIETE_DIAS, AHORA);

    const { desde, generos } = metricasRepository.obtenerMetricas.mock.calls[0][0];
    expect(desde).toBe('2026-11-09T12:00:00.000Z');
    expect(Object.keys(generos)).toEqual(GENEROS_BUSQUEDA.map(({ id }) => id));
    expect(generos['accion-aventura']).toEqual([28, 12, 10759]);
    expect(generos.animacion).toEqual([16]);
  });

  it('devuelve el período, los totales y los géneros con su nombre', async () => {
    metricasRepository.obtenerMetricas.mockResolvedValue(
      metricasDelRepository({
        genero: {
          watchlist: [{ genero: 'drama', cantidad: 8 }],
          busquedas: [
            { genero: 'terror', cantidad: 3 },
            { genero: 'genero-viejo', cantidad: 1 },
          ],
        },
      }),
    );

    const metricas = await obtenerMetricas(PERIODO_METRICAS.TODO, AHORA);

    expect(metricas.periodo).toBe(PERIODO_METRICAS.TODO);
    expect(metricas.totales).toEqual(TOTALES);
    expect(metricas.rankings.genero).toEqual({
      watchlist: [{ id: 'drama', nombre: 'Drama', cantidad: 8 }],
      busquedas: [{ id: 'terror', nombre: 'Terror', cantidad: 3 }],
    });
  });

  it('no devuelve los textos buscados menos veces que el mínimo', async () => {
    metricasRepository.obtenerMetricas.mockResolvedValue(
      metricasDelRepository({
        textosBuscados: [
          { texto: 'friends', cantidad: MIN_CANTIDAD_TEXTO_BUSCADO },
          { texto: 'ana@mail.com', cantidad: MIN_CANTIDAD_TEXTO_BUSCADO - 1 },
        ],
      }),
    );

    const metricas = await obtenerMetricas(PERIODO_METRICAS.TREINTA_DIAS, AHORA);

    expect(metricas.rankings.textosBuscados).toEqual([
      { texto: 'friends', cantidad: MIN_CANTIDAD_TEXTO_BUSCADO },
    ]);
  });
});
