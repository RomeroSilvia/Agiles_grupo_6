import { LOCALE } from '../config/app.config.js';

const FORMATEADOR_NUMERO = new Intl.NumberFormat(LOCALE);

export function formatearNumero(numero) {
  return FORMATEADOR_NUMERO.format(numero);
}
