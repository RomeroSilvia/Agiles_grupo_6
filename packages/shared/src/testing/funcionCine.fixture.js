// Datos ficticios exclusivos de pruebas; no habilitan cobertura productiva.
export const FUENTE_CINE_FIXTURE = {
  fuenteId: 'serpapi',
  registroId: null,
  url: null,
  consultadoEn: '2026-11-14T12:00:00.000Z',
  actualizadoEn: null,
};
export const CIUDAD_CINE_FIXTURE = {
  id: 'ar:550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Ciudad de prueba',
  provincia: 'Buenos Aires',
  pais: 'AR',
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  cobertura: 'disponible',
  fuente: FUENTE_CINE_FIXTURE,
};
export const CINES_FIXTURE = ['1', '2'].map((numero) => ({
  id: `cine:${numero.repeat(64)}`,
  ciudadId: CIUDAD_CINE_FIXTURE.id,
  nombre: 'Cine Central',
  direccion: `Calle ${numero} 123`,
  zonaHoraria: CIUDAD_CINE_FIXTURE.zonaHoraria,
  urlSitio: null,
  fuentes: [FUENTE_CINE_FIXTURE],
}));
export const FUNCIONES_FIXTURE = [
  { numero: '1', cine: 0, fecha: '2026-11-15', hora: '00:30' },
  { numero: '2', cine: 0, fecha: '2026-11-16', hora: '20:00' },
  { numero: '3', cine: 1, fecha: '2026-11-15', hora: '22:00' },
].map(({ numero, cine, fecha, hora }) => ({
  id: `funcion:${numero.repeat(64)}`,
  tmdbId: 77,
  tipo: 'pelicula',
  ciudadId: CIUDAD_CINE_FIXTURE.id,
  cineId: CINES_FIXTURE[cine].id,
  cineNombre: CINES_FIXTURE[cine].nombre,
  inicio: `${fecha}T${hora}:00-03:00`,
  fechaLocal: fecha,
  horaLocal: hora,
  zonaHoraria: CIUDAD_CINE_FIXTURE.zonaHoraria,
  sala: null,
  formato: '2D',
  idioma: null,
  subtitulos: null,
  urlCompra: null,
  fuentes: [FUENTE_CINE_FIXTURE],
}));
export function crearRespuestaFuncionesFixture(cambios = {}) {
  return structuredClone({
    tmdbId: 77,
    tipo: 'pelicula',
    ciudad: CIUDAD_CINE_FIXTURE,
    desde: '2026-11-14',
    hasta: '2026-11-21',
    cines: CINES_FIXTURE,
    funciones: FUNCIONES_FIXTURE,
    estado: 'incompleta',
    advertencias: [
      { code: 'INCOMPLETE_DATA', message: 'Cobertura parcial de prueba', fuenteId: 'serpapi' },
    ],
    fuentes: [FUENTE_CINE_FIXTURE],
    consultadoEn: FUENTE_CINE_FIXTURE.consultadoEn,
    ...cambios,
  });
}
