import { respuestaEventosSchema, eventoSchema } from '@buscador/shared/schemas';
import { PAGINA_MAXIMA_EVENTOS, ZONA_HORARIA_EVENTOS } from '@buscador/shared/constants';
import * as allEventsIntegration from '../integrations/allEvents.integration.js';

const formateadorFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA_EVENTOS,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function normalizarTexto(value) {
  return (
    value
      ?.normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase() ?? ''
  );
}

function obtenerFechaLocal(value) {
  return formateadorFecha.format(new Date(value));
}

export async function listarEventos({ categoria, fecha, pagina }) {
  const respuesta = await allEventsIntegration.listarEventosAllEvents({ categoria, fecha, pagina });
  const resultados = new Map();
  let incompleta = respuesta.incompleta || respuesta.siguientePagina > PAGINA_MAXIMA_EVENTOS;
  const hoy = obtenerFechaLocal(Date.now());
  for (const evento of respuesta.eventos) {
    const ciudad = normalizarTexto(evento.ciudad);
    const pais = normalizarTexto(evento.pais);
    if (
      evento.virtual ||
      evento.cancelado ||
      (ciudad && ciudad !== 'la plata') ||
      (pais && !['ar', 'argentina'].includes(pais))
    ) {
      continue;
    }
    if (!evento.url) {
      incompleta = true;
      continue;
    }
    const ultimoDia = evento.fin
      ? obtenerFechaLocal(evento.fin)
      : (evento.fechaFin ?? (evento.inicio ? obtenerFechaLocal(evento.inicio) : evento.fecha));
    if (ultimoDia && ultimoDia < hoy) {
      continue;
    }
    resultados.set(evento.id, eventoSchema.strip().parse(evento));
  }
  return respuestaEventosSchema.parse({
    ciudad: 'La Plata',
    provincia: 'Buenos Aires',
    zonaHoraria: ZONA_HORARIA_EVENTOS,
    pagina,
    siguientePagina:
      respuesta.siguientePagina <= PAGINA_MAXIMA_EVENTOS ? respuesta.siguientePagina : null,
    resultados: [...resultados.values()],
    incompleta,
    fuente: {
      nombre: 'AllEvents',
      url: 'https://allevents.in/la-plata',
      consultadoEn: respuesta.consultadoEn,
    },
  });
}
