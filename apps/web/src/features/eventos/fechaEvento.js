import { ZONA_HORARIA_EVENTOS } from '@buscador/shared/constants';

const fechaFormatter = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeZone: 'UTC' });
const inicioFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeStyle: 'short',
  hourCycle: 'h23',
  timeZone: ZONA_HORARIA_EVENTOS,
});
const TRADUCCIONES_FECHA = {
  Mon: 'Lun',
  Tue: 'Mar',
  Wed: 'Mié',
  Thu: 'Jue',
  Fri: 'Vie',
  Sat: 'Sáb',
  Sun: 'Dom',
  Jan: 'ene',
  Feb: 'feb',
  Mar: 'mar',
  Apr: 'abr',
  May: 'may',
  Jun: 'jun',
  Jul: 'jul',
  Aug: 'ago',
  Sep: 'sep',
  Oct: 'oct',
  Nov: 'nov',
  Dec: 'dic',
};

export function formatearFechaEvento(evento) {
  if (evento.inicio) {
    return inicioFormatter.format(new Date(evento.inicio));
  }
  if (evento.fecha) {
    return fechaFormatter.format(new Date(`${evento.fecha}T12:00:00Z`));
  }
  if (evento.fechaTexto) {
    // Traducir solo las etiquetas; no inferir año, fecha ISO ni zona desde texto libre.
    return evento.fechaTexto.replace(
      /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g,
      (parte) => TRADUCCIONES_FECHA[parte],
    );
  }
  return 'Fecha y horario a confirmar';
}
