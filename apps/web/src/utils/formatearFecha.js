import { LOCALE } from '../config/app.config.js';

const FORMATEADOR_FECHA_LARGA = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'long',
  timeZone: 'UTC',
});

const FORMATEADOR_FECHA_CORTA = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatearFechaCivil(fechaIso) {
  return FORMATEADOR_FECHA_LARGA.format(new Date(`${fechaIso}T00:00:00.000Z`));
}

export function formatearFechaCorta(fecha) {
  return FORMATEADOR_FECHA_CORTA.format(new Date(fecha));
}
