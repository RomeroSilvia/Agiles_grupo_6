import { z } from 'zod';
import { ANIO_MAXIMO, ANIO_MINIMO, PAGINA_MAXIMA, TIPOS_TITULO } from '../constants/index.js';

const tmdbIdSchema = z.union([
  z.number().int().min(1).max(2147483647),
  z
    .string()
    .regex(/^[1-9]\d{0,9}$/, 'El identificador debe ser un número entero positivo')
    .transform(Number)
    .pipe(z.number().int().max(2147483647)),
]);

const filtrosBusquedaSchema = z.object({
  q: z.string().trim().max(100).default(''),
  tipo: z.enum(TIPOS_TITULO).optional(),
  anio: z.coerce
    .number()
    .int('El año debe ser un número entero')
    .min(ANIO_MINIMO, `El año debe ser mayor o igual a ${ANIO_MINIMO}`)
    .max(ANIO_MAXIMO, `El año debe ser menor o igual a ${ANIO_MAXIMO}`)
    .optional(),
  genero: tmdbIdSchema.optional(),
  actor: tmdbIdSchema.optional(),
  director: tmdbIdSchema.optional(),
  pagina: z.coerce.number().int().min(1).max(PAGINA_MAXIMA).default(1),
});

export const busquedaPropiasSchema = filtrosBusquedaSchema;

export const busquedaSchema = filtrosBusquedaSchema.refine(
  ({ q, tipo, anio, genero, actor, director }) =>
    Boolean(q) || [tipo, anio, genero, actor, director].some((filtro) => filtro !== undefined),
  {
    message: 'Ingresá un título o seleccioná al menos un filtro',
    path: ['q'],
  },
);
