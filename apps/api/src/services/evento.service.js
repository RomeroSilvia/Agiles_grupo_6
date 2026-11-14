import { z } from 'zod';
import {
  enlaceEventoSchema,
  imagenEventoSchema,
  respuestaEventosSchema,
} from '@buscador/shared/schemas';
import { PAGINA_MAXIMA_EVENTOS, ZONA_HORARIA_EVENTOS } from '@buscador/shared/constants';
import * as allEventsIntegration from '../integrations/allEvents.integration.js';

const fechaSchema = z.iso.date();
const inicioSchema = z.iso.datetime({ offset: true });
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
  let incompleta = respuesta.incompleta || respuesta.next_page > PAGINA_MAXIMA_EVENTOS;
  const hoy = obtenerFechaLocal(Date.now());
  for (const evento of respuesta.events) {
    const ciudad = normalizarTexto(evento.venue?.city);
    const pais = normalizarTexto(evento.venue?.country);
    if (
      evento.online ||
      /online/i.test(evento.attendance_mode ?? '') ||
      /cancelled|canceled/i.test(evento.status ?? '') ||
      (ciudad && ciudad !== 'la plata') ||
      (pais && !['ar', 'argentina'].includes(pais))
    ) {
      continue;
    }
    const url = enlaceEventoSchema.safeParse(evento.url);
    if (!url.success) {
      incompleta = true;
      continue;
    }
    const inicio = inicioSchema.safeParse(evento.start);
    const fechaInicio = fechaSchema.safeParse(evento.start);
    const fechaFin = fechaSchema.safeParse(evento.end);
    const fin = inicioSchema.safeParse(evento.end);
    const ultimoDia = fin.success
      ? obtenerFechaLocal(fin.data)
      : fechaFin.success
        ? fechaFin.data
        : inicio.success
          ? obtenerFechaLocal(inicio.data)
          : fechaInicio.success
            ? fechaInicio.data
            : null;
    if (ultimoDia && ultimoDia < hoy) {
      continue;
    }
    const imagen = imagenEventoSchema.safeParse(evento.image);
    resultados.set(evento.id, {
      id: evento.id,
      nombre: evento.name,
      url: url.data,
      imagenUrl: imagen.success ? imagen.data : null,
      fecha: fechaInicio.success ? fechaInicio.data : null,
      inicio: inicio.success ? inicio.data : null,
      fechaTexto: evento.date_label?.trim() || null,
      lugar: evento.venue?.name?.trim() || null,
      direccion: evento.venue?.street?.trim() || null,
      precioTexto: /^free$/i.test(evento.price?.trim() ?? '')
        ? 'Gratis'
        : evento.price?.trim() || null,
    });
  }
  return respuestaEventosSchema.parse({
    ciudad: 'La Plata',
    provincia: 'Buenos Aires',
    zonaHoraria: ZONA_HORARIA_EVENTOS,
    pagina,
    siguientePagina: respuesta.next_page <= PAGINA_MAXIMA_EVENTOS ? respuesta.next_page : null,
    resultados: [...resultados.values()],
    incompleta,
    fuente: {
      nombre: 'AllEvents',
      url: 'https://allevents.in/la-plata',
      consultadoEn: respuesta.consultadoEn,
    },
  });
}
