export function obtenerOpcionesFunciones(data) {
  return {
    fechas: [...new Set((data?.funciones ?? []).map((funcion) => funcion.fechaLocal))].sort(),
    cines: [...(data?.cines ?? [])].sort(
      (a, b) => a.nombre.localeCompare(b.nombre, 'es-AR') || a.id.localeCompare(b.id),
    ),
  };
}

export function filtrarFunciones(funciones, { fecha, cineId }) {
  return funciones.filter(
    (funcion) => (!fecha || funcion.fechaLocal === fecha) && (!cineId || funcion.cineId === cineId),
  );
}
