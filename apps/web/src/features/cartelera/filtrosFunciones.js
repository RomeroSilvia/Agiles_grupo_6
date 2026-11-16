import { LOCALE } from '../../config/app.config.js';

export function ordenarCines(a, b) {
  return a.nombre.localeCompare(b.nombre, LOCALE) || a.id.localeCompare(b.id);
}

export function obtenerOpcionesFunciones(data) {
  return {
    fechas: [...new Set((data?.funciones ?? []).map((funcion) => funcion.fechaLocal))].sort(),
    cines: [...(data?.cines ?? [])].sort(ordenarCines),
  };
}

export function filtrarFunciones(funciones, { fecha, cineId }) {
  return funciones.filter(
    (funcion) => (!fecha || funcion.fechaLocal === fecha) && (!cineId || funcion.cineId === cineId),
  );
}
