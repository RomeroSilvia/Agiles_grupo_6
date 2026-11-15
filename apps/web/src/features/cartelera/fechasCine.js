const formateador = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeZone: 'UTC' });
export function formatearFechaCine(fecha) {
  return formateador.format(new Date(`${fecha}T12:00:00Z`));
}
export function formatearConsultaCine(instante, zonaHoraria) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: zonaHoraria,
  }).format(new Date(instante));
}
