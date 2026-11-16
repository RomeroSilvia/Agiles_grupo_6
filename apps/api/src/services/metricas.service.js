import {
  DIAS_POR_PERIODO_METRICAS,
  GENEROS_BUSQUEDA,
  MIN_CANTIDAD_TEXTO_BUSCADO,
} from '@buscador/shared/constants';
import * as metricasRepository from '../repositories/metricas.repository.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const GENEROS_TMDB_POR_ID = Object.freeze(
  Object.fromEntries(
    GENEROS_BUSQUEDA.map(({ id, tmdbIds }) => [id, [...new Set(Object.values(tmdbIds).flat())]]),
  ),
);

const NOMBRES_GENERO = new Map(GENEROS_BUSQUEDA.map(({ id, nombre }) => [id, nombre]));

export function calcularDesde(periodo, ahora = new Date()) {
  const dias = DIAS_POR_PERIODO_METRICAS[periodo];
  return dias === null ? null : new Date(ahora.getTime() - dias * MS_POR_DIA).toISOString();
}

function conNombreGenero(ranking) {
  return ranking
    .filter(({ genero }) => NOMBRES_GENERO.has(genero))
    .map(({ genero, cantidad }) => ({ id: genero, nombre: NOMBRES_GENERO.get(genero), cantidad }));
}

export async function obtenerMetricas(periodo, ahora = new Date()) {
  const { totales, rankings } = await metricasRepository.obtenerMetricas({
    desde: calcularDesde(periodo, ahora),
    generos: GENEROS_TMDB_POR_ID,
  });

  return {
    periodo,
    totales,
    rankings: {
      ...rankings,
      genero: {
        watchlist: conNombreGenero(rankings.genero.watchlist),
        busquedas: conNombreGenero(rankings.genero.busquedas),
      },
      textosBuscados: rankings.textosBuscados.filter(
        ({ cantidad }) => cantidad >= MIN_CANTIDAD_TEXTO_BUSCADO,
      ),
    },
  };
}
