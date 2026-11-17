import { NOMBRES_REGION, TIPOS_TITULO } from '@buscador/shared/constants';
import { ETIQUETA_OTRAS, MAX_FILAS_RANKING } from './administracion.constants.js';

const CLAVE_OTRAS = 'otras';
export const PORCENTAJE_TOTAL = 100;

export function agruparResto(items, maxFilas = MAX_FILAS_RANKING) {
  if (items.length <= maxFilas) {
    return items;
  }
  const visibles = items.slice(0, maxFilas - 1);
  const cantidadResto = items
    .slice(maxFilas - 1)
    .reduce((total, { cantidad }) => total + cantidad, 0);
  return [...visibles, { clave: CLAVE_OTRAS, etiqueta: ETIQUETA_OTRAS, cantidad: cantidadResto }];
}

export function aItemsGenero(ranking) {
  return agruparResto(
    ranking.map(({ id, nombre, cantidad }) => ({ clave: id, etiqueta: nombre, cantidad })),
  );
}

export function aItemsRegion(ranking) {
  return agruparResto(
    ranking.map(({ region, cantidad }) => ({
      clave: region,
      etiqueta: NOMBRES_REGION[region] ?? region,
      cantidad,
    })),
  );
}

export function aItemsTexto(ranking) {
  return ranking.map(({ texto, cantidad }) => ({ clave: texto, etiqueta: texto, cantidad }));
}

export function aItemsPlataforma(ranking, plataformasPorId) {
  return ranking
    .filter(({ plataformaId }) => plataformasPorId.has(plataformaId))
    .map(({ plataformaId, cantidad }) => {
      const plataforma = plataformasPorId.get(plataformaId);
      return { clave: plataformaId, etiqueta: plataforma.nombre, cantidad, plataforma };
    });
}

export function calcularPorcentajesTipo(ranking) {
  const total = ranking.reduce((suma, { cantidad }) => suma + cantidad, 0);
  if (total === 0) {
    return [];
  }

  const cantidadPorTipo = new Map(ranking.map(({ tipo, cantidad }) => [tipo, cantidad]));
  let porcentajeAsignado = 0;

  return TIPOS_TITULO.map((tipo, indice) => {
    const cantidad = cantidadPorTipo.get(tipo) ?? 0;
    const esUltimo = indice === TIPOS_TITULO.length - 1;
    const porcentaje = esUltimo
      ? PORCENTAJE_TOTAL - porcentajeAsignado
      : Math.round((cantidad / total) * PORCENTAJE_TOTAL);
    porcentajeAsignado += porcentaje;
    return { tipo, cantidad, porcentaje };
  });
}
