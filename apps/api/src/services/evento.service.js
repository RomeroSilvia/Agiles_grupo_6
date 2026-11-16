import { respuestaEventosSchema, eventoSchema } from '@buscador/shared/schemas';
import {
  CIUDAD_EVENTOS,
  PAGINA_MAXIMA_EVENTOS,
  URL_FUENTE_EVENTOS,
  ZONA_HORARIA_EVENTOS,
} from '@buscador/shared/constants';
import { obtenerFechaCivil } from '@buscador/shared/utils';
import * as allEventsIntegration from '../integrations/allEvents.integration.js';

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
  return obtenerFechaCivil(value, ZONA_HORARIA_EVENTOS);
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
      (ciudad && ciudad !== normalizarTexto(CIUDAD_EVENTOS.CIUDAD)) ||
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
    ciudad: CIUDAD_EVENTOS.CIUDAD,
    provincia: CIUDAD_EVENTOS.PROVINCIA,
    zonaHoraria: ZONA_HORARIA_EVENTOS,
    pagina,
    siguientePagina:
      respuesta.siguientePagina <= PAGINA_MAXIMA_EVENTOS ? respuesta.siguientePagina : null,
    resultados: [...resultados.values()],
    incompleta,
    fuente: {
      nombre: 'AllEvents',
      url: URL_FUENTE_EVENTOS,
      consultadoEn: respuesta.consultadoEn,
    },
  });
}
