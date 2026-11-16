import { LOCALE } from '../../config/app.config.js';

export function formatearConsultaCine(instante, zonaHoraria) {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: zonaHoraria,
  }).format(new Date(instante));
}
