const FORMATEADOR_NUMERO = new Intl.NumberFormat('es-AR');

export function formatearNumero(numero) {
  return FORMATEADOR_NUMERO.format(numero);
}
