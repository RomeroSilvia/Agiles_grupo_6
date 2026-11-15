import { z } from 'zod';
import { enlaceEventoSchema, imagenEventoSchema } from '@buscador/shared/schemas';

const fechaSchema = z.iso.date();
const inicioSchema = z.iso.datetime({ offset: true });
const texto = (valor) => valor?.trim() || null;

export function fromAllEvents(evento) {
  const inicio = inicioSchema.safeParse(evento.start);
  const fin = inicioSchema.safeParse(evento.end);
  return {
    id: evento.id,
    nombre: evento.name,
    url: enlaceEventoSchema.safeParse(evento.url).data ?? null,
    imagenUrl: imagenEventoSchema.safeParse(evento.image).data ?? null,
    fecha: fechaSchema.safeParse(evento.start).data ?? null,
    inicio: inicio.success ? inicio.data : null,
    fechaFin: fechaSchema.safeParse(evento.end).data ?? null,
    fin: fin.success ? fin.data : null,
    fechaTexto: texto(evento.date_label),
    lugar: texto(evento.venue?.name),
    direccion: texto(evento.venue?.street),
    ciudad: texto(evento.venue?.city),
    pais: texto(evento.venue?.country),
    virtual: Boolean(evento.online || /online/i.test(evento.attendance_mode ?? '')),
    cancelado: /cancelled|canceled/i.test(evento.status ?? ''),
    precioTexto: /^free$/i.test(evento.price?.trim() ?? '') ? 'Gratis' : texto(evento.price),
  };
}

// El listado puede ofrecer solo date_label y el nombre del lugar, sin fecha ISO.
const eventoAllEventsSchema = z.object({
  id: z.union([z.string().trim().min(1), z.number().int().positive()]).transform(String),
  name: z.string().trim().min(1),
  url: z.string(),
  start: z.string().nullish(),
  end: z.string().nullish(),
  date_label: z.string().nullish(),
  status: z.string().nullish(),
  online: z.boolean().nullish(),
  attendance_mode: z.string().nullish(),
  image: z.string().nullish(),
  price: z.string().nullish(),
  venue: z
    .object({
      name: z.string().nullish(),
      street: z.string().nullish(),
      city: z.string().nullish(),
      country: z.string().nullish(),
    })
    .nullish(),
});

export const respuestaAllEventsSchema = z
  .object({
    city: z.literal('la-plata'),
    page: z.number().int().positive(),
    next_page: z.number().int().positive().nullable(),
    events: z.array(z.unknown()).max(500),
    fetched_at: z.iso.datetime({ offset: true }).nullish(),
  })
  .transform(({ events, ...resto }) => {
    const eventos = events.map((evento) => eventoAllEventsSchema.safeParse(evento));
    return {
      ciudad: resto.city,
      pagina: resto.page,
      siguientePagina: resto.next_page,
      consultadoEn: resto.fetched_at ?? new Date().toISOString(),
      eventos: eventos
        .filter((evento) => evento.success)
        .map((evento) => fromAllEvents(evento.data)),
      incompleta: eventos.some((evento) => !evento.success),
    };
  });
