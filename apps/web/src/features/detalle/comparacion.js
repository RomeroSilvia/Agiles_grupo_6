import { TIPO_OFERTA } from '@buscador/shared/constants';
import { ETIQUETAS_OFERTA } from './detalle.constants.js';

const ORDEN_TIPOS_OFERTA = Object.keys(ETIQUETAS_OFERTA);

export function columnasComparacion(filas) {
  const presentes = new Set(
    filas.flatMap(({ ofertas }) => ofertas.map(({ tipoOferta }) => tipoOferta)),
  );
  const columnas = ORDEN_TIPOS_OFERTA.filter((tipo) => presentes.has(tipo));
  return columnas.length > 0 ? columnas : [TIPO_OFERTA.SUSCRIPCION];
}

export function plataformasPorTipo(ofertas, tipoOferta) {
  return ofertas.find((oferta) => oferta.tipoOferta === tipoOferta)?.plataformas ?? [];
}

export function contarRegionesConPropias(filas) {
  return filas.filter(({ ofertas }) =>
    ofertas.some(({ plataformas }) => plataformas.some(({ esPropia }) => esPropia)),
  ).length;
}
