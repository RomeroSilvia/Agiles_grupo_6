import { ZONA_HORARIA_AR } from '../constants/cartelera.constants.js';

const formateadoresPorZona = new Map();

function obtenerFormateador(zonaHoraria) {
  if (!formateadoresPorZona.has(zonaHoraria)) {
    formateadoresPorZona.set(
      zonaHoraria,
      new Intl.DateTimeFormat('en-CA', {
        timeZone: zonaHoraria,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    );
  }
  return formateadoresPorZona.get(zonaHoraria);
}

export function obtenerFechaCivil(fecha, zonaHoraria) {
  return obtenerFormateador(zonaHoraria).format(new Date(fecha));
}

export function obtenerHoyArgentina(ahora = new Date()) {
  return obtenerFechaCivil(ahora, ZONA_HORARIA_AR);
}

export function sumarDiasCivil(fecha, dias) {
  const instante = new Date(`${fecha}T12:00:00Z`);
  instante.setUTCDate(instante.getUTCDate() + dias);
  return instante.toISOString().slice(0, 10);
}
