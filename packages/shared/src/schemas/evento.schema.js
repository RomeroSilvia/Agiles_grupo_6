import { z } from 'zod';
import {
  CATEGORIAS_EVENTOS,
  CIUDAD_EVENTOS,
  PAGINA_MAXIMA_EVENTOS,
  PERIODOS_EVENTOS,
  URL_FUENTE_EVENTOS,
  ZONA_HORARIA_EVENTOS,
} from '../constants/eventos.constants.js';

export const consultaEventosSchema = z
  .object({
    categoria: z.enum(CATEGORIAS_EVENTOS.map(({ id }) => id)).default('todas'),
    fecha: z.enum(PERIODOS_EVENTOS.map(({ id }) => id)).default('todas'),
    pagina: z.coerce.number().int().min(1).max(PAGINA_MAXIMA_EVENTOS).default(1),
  })
  .strict()
  .refine(({ categoria, fecha }) => categoria === 'todas' || fecha === 'todas', {
    message: 'Elegí una categoría o un período para consultar eventos',
    path: ['categoria'],
  });

export const enlaceEventoSchema = z.url({ protocol: /^https$/ }).refine((value) => {
  const url = new URL(value);
  return (
    url.hostname === 'allevents.in' &&
    !url.username &&
    !url.password &&
    !url.port &&
    url.pathname.startsWith('/la-plata/') &&
    !url.search &&
    !url.hash
  );
}, 'El enlace debe corresponder a una publicación de La Plata en AllEvents');

export const imagenEventoSchema = z.url({ protocol: /^https$/ }).refine((value) => {
  const url = new URL(value);
  return (
    ['cdn-az.allevents.in', 'cdn-ip.allevents.in', 'cdn2.allevents.in'].includes(url.hostname) &&
    !url.username &&
    !url.password &&
    !url.port
  );
}, 'La imagen debe provenir de AllEvents');

export const eventoSchema = z
  .object({
    id: z.string().min(1),
    nombre: z.string().min(1),
    url: enlaceEventoSchema,
    imagenUrl: imagenEventoSchema.nullable(),
    fecha: z.iso.date().nullable(),
    inicio: z.iso.datetime({ offset: true }).nullable(),
    fechaTexto: z.string().nullable(),
    lugar: z.string().nullable(),
    direccion: z.string().nullable(),
    precioTexto: z.string().nullable(),
  })
  .strict();

export const respuestaEventosSchema = z
  .object({
    ciudad: z.literal(CIUDAD_EVENTOS.CIUDAD),
    provincia: z.literal(CIUDAD_EVENTOS.PROVINCIA),
    zonaHoraria: z.literal(ZONA_HORARIA_EVENTOS),
    pagina: z.number().int().positive(),
    siguientePagina: z.number().int().positive().max(PAGINA_MAXIMA_EVENTOS).nullable(),
    resultados: z.array(eventoSchema),
    incompleta: z.boolean(),
    fuente: z
      .object({
        nombre: z.literal('AllEvents'),
        url: z.literal(URL_FUENTE_EVENTOS),
        consultadoEn: z.iso.datetime({ offset: true }),
      })
      .strict(),
  })
  .strict();
