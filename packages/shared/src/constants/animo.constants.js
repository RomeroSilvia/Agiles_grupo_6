// Lista fija de la búsqueda por estado de ánimo. Los criterios de cada uno (géneros y
// puntuación mínima) viven en la API: el front solo necesita el id y los textos.
export const ESTADOS_ANIMO = Object.freeze([
  Object.freeze({
    id: 'para-reir',
    nombre: 'Para reír',
    descripcion: 'Comedias bien puntuadas para pasar un buen rato.',
  }),
  Object.freeze({
    id: 'algo-liviano',
    nombre: 'Algo liviano',
    descripcion: 'Historias simples y amables, sin sustos ni tensión.',
  }),
  Object.freeze({
    id: 'para-pensar',
    nombre: 'Para pensar',
    descripcion: 'Dramas, documentales y ciencia ficción que dejan algo.',
  }),
  Object.freeze({
    id: 'con-tension',
    nombre: 'Con tensión',
    descripcion: 'Suspenso, crimen y misterio para no despegarse.',
  }),
  Object.freeze({
    id: 'para-emocionarme',
    nombre: 'Para emocionarme',
    descripcion: 'Dramas y romances que llegan al corazón.',
  }),
]);

export const ESTADOS_ANIMO_IDS = Object.freeze(ESTADOS_ANIMO.map(({ id }) => id));
