import { CARDS_CARGANDO } from './busqueda.constants.js';
import { ResultadoCardCargando } from './ResultadoCardCargando.jsx';

const CARDS_ESQUELETO = Array.from({ length: CARDS_CARGANDO }, (_, indice) => indice);

export function CardsCargando() {
  return CARDS_ESQUELETO.map((indice) => <ResultadoCardCargando key={indice} />);
}
