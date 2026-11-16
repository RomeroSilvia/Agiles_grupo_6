import { z } from 'zod';
import {
  HORIZONTE_ESTRENOS_DIAS,
  ESTADOS_EXHIBICION,
  ESTADOS_FECHA,
  FUENTE_ID_TMDB,
  REGION_CARTELERA,
  TIPO_TITULO,
  TMDB_ID_MAXIMO,
  PAGINA_MAXIMA,
} from '../constants/index.js';
import { obtenerHoyArgentina, sumarDiasCivil } from '../utils/fechaCivil.js';
import { tmdbIdSchema } from './busqueda.schema.js';

export const fechaCivilCarteleraSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((fecha) => {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia));
    return (
      fechaUtc.getUTCFullYear() === anio &&
      fechaUtc.getUTCMonth() === mes - 1 &&
      fechaUtc.getUTCDate() === dia
    );
  });

const fechaUtcSchema = z.iso.datetime({ offset: false });

export const fuenteSchema = z.object({
  fuenteId: z.string().min(1),
  registroId: z.string().nullable(),
  url: z.url({ protocol: /^https?$/ }).nullable(),
  consultadoEn: fechaUtcSchema,
  actualizadoEn: fechaUtcSchema.nullable(),
});

export const fuenteCarteleraSchema = fuenteSchema.extend({
  fuenteId: z.literal(FUENTE_ID_TMDB),
});

export const peliculaCarteleraSchema = z.object({
  tmdbId: tmdbIdSchema.pipe(z.number().int().min(1).max(TMDB_ID_MAXIMO)),
  tipo: z.literal(TIPO_TITULO.PELICULA),
  nombre: z.string().nullable(),
  posterUrl: z.url().nullable(),
  anio: z.number().int().nullable(),
  puntuacion: z.number().min(0).max(10).nullable(),
  region: z.literal(REGION_CARTELERA),
  estadoExhibicion: z.enum(ESTADOS_EXHIBICION),
  fechaEstrenoAr: fechaCivilCarteleraSchema.nullable(),
  estadoFecha: z.enum(ESTADOS_FECHA),
  fuente: fuenteCarteleraSchema,
});

export const paginaCarteleraSchema = z
  .union([
    z.number().int(),
    z
      .string()
      .regex(/^[1-9]\d*$/, 'La página debe ser un entero positivo')
      .transform(Number),
  ])
  .pipe(z.number().int().min(1).max(PAGINA_MAXIMA));

export const consultaCarteleraSchema = z
  .object({ pagina: paginaCarteleraSchema.default(1) })
  .strict();

export const respuestaCarteleraSchema = z.object({
  region: z.literal(REGION_CARTELERA),
  resultados: z.array(peliculaCarteleraSchema),
  pagina: z.number().int().min(1).max(PAGINA_MAXIMA),
  totalResultados: z.number().int().min(0),
  totalPaginas: z.number().int().min(0).max(PAGINA_MAXIMA),
  fuente: fuenteCarteleraSchema,
});

export const consultaEstrenosSchema = z
  .object({
    desde: fechaCivilCarteleraSchema.optional(),
    hasta: fechaCivilCarteleraSchema.optional(),
    pagina: paginaCarteleraSchema.default(1),
  })
  .strict()
  .transform(({ desde, hasta, pagina }) => {
    const inicio = desde ?? sumarDiasCivil(obtenerHoyArgentina(), 1);
    return {
      desde: inicio,
      hasta: hasta ?? sumarDiasCivil(inicio, HORIZONTE_ESTRENOS_DIAS - 1),
      pagina,
    };
  })
  .superRefine(({ desde, hasta }, ctx) => {
    if (desde <= obtenerHoyArgentina()) {
      ctx.addIssue({
        code: 'custom',
        path: ['desde'],
        message: 'La fecha inicial debe ser posterior a hoy en Argentina',
      });
    }
    if (hasta < desde || hasta > sumarDiasCivil(desde, HORIZONTE_ESTRENOS_DIAS - 1)) {
      ctx.addIssue({
        code: 'custom',
        path: ['hasta'],
        message: `El período debe abarcar entre 1 y ${HORIZONTE_ESTRENOS_DIAS} días`,
      });
    }
  });

export const respuestaEstrenosSchema = respuestaCarteleraSchema.extend({
  desde: fechaCivilCarteleraSchema,
  hasta: fechaCivilCarteleraSchema,
});

export const respuestaExhibicionCineSchema = z.object({ consultable: z.boolean() }).strict();
