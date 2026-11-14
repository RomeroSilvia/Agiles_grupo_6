import { z } from 'zod';

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
      ...resto,
      events: eventos.filter((evento) => evento.success).map((evento) => evento.data),
      incompleta: eventos.some((evento) => !evento.success),
    };
  });
