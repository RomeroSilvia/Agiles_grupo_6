export function formatearPuntuacion(puntuacion) {
  return puntuacion === null || puntuacion === undefined ? null : `${puntuacion.toFixed(1)}/10`;
}
