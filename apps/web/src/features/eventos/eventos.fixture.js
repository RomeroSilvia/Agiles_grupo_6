export const EVENTO_FIXTURE = Object.freeze({
  id: 'evento-1',
  nombre: 'Teatro bajo las estrellas',
  url: 'https://allevents.in/la-plata/teatro-bajo-las-estrellas/1',
  imagenUrl: null,
  fecha: '2026-11-25',
  inicio: null,
  fechaTexto: null,
  lugar: 'Teatro de prueba',
  direccion: 'Calle 10 733',
  precioTexto: 'Gratis',
});

export function crearRespuestaEventos(resultados = [EVENTO_FIXTURE], extra = {}) {
  return {
    ciudad: 'La Plata',
    provincia: 'Buenos Aires',
    zonaHoraria: 'America/Argentina/Buenos_Aires',
    pagina: 1,
    siguientePagina: null,
    resultados,
    incompleta: false,
    fuente: {
      nombre: 'AllEvents',
      url: 'https://allevents.in/la-plata',
      consultadoEn: '2026-11-14T12:00:00Z',
    },
    ...extra,
  };
}
