import { z } from 'zod';
import {
  ANIO_MAXIMO,
  ANIO_MINIMO,
  GENEROS_BUSQUEDA_IDS,
  MAX_LARGO_TEXTO_BUSQUEDA,
  PAGINA_MAXIMA,
  ROLES_PERSONA,
  TIPOS_TITULO,
  TMDB_ID_MAXIMO,
} from '../constants/index.js';

export const tmdbIdSchema = z.union([
  z.number().int().min(1).max(TMDB_ID_MAXIMO),
  z
    .string()
    .regex(/^[1-9]\d{0,9}$/, 'El identificador debe ser un número entero positivo')
    .transform(Number)
    .pipe(z.number().int().max(TMDB_ID_MAXIMO)),
]);

export const tituloParamsSchema = z.object({ tipo: z.enum(TIPOS_TITULO), tmdbId: tmdbIdSchema });

export const personaBusquedaSchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(2, 'Ingresá al menos dos letras para buscar personas')
      .max(MAX_LARGO_TEXTO_BUSQUEDA),
    rol: z.enum(ROLES_PERSONA),
  })
  .strict();

export const personaIdBusquedaSchema = z
  .object({
    id: tmdbIdSchema,
    rol: z.enum(ROLES_PERSONA),
  })
  .strict();

export const personaRolSchema = z.object({ rol: z.enum(ROLES_PERSONA) }).strict();

const filtrosBusquedaSchema = z
  .object({
    q: z.string().trim().max(MAX_LARGO_TEXTO_BUSQUEDA).default(''),
    tipo: z.enum(TIPOS_TITULO).optional(),
    anio: z.coerce
      .number()
      .int('El año debe ser un número entero')
      .min(ANIO_MINIMO, `El año debe ser mayor o igual a ${ANIO_MINIMO}`)
      .max(ANIO_MAXIMO, `El año debe ser menor o igual a ${ANIO_MAXIMO}`)
      .optional(),
    genero: z.enum(GENEROS_BUSQUEDA_IDS).optional(),
    actor: tmdbIdSchema.optional(),
    director: tmdbIdSchema.optional(),
    pagina: z.coerce.number().int().min(1).max(PAGINA_MAXIMA).default(1),
  })
  .strict();

export const busquedaPropiasSchema = filtrosBusquedaSchema;

// Una búsqueda necesita un texto o al menos un filtro; sin nada es solo recorrer el catálogo
export function tieneCriterioBusqueda({ q, tipo, anio, genero, actor, director } = {}) {
  return (
    Boolean(q?.trim()) ||
    [tipo, anio, genero, actor, director].some((filtro) => filtro !== undefined)
  );
}

export const busquedaSchema = filtrosBusquedaSchema.refine(tieneCriterioBusqueda, {
  message: 'Ingresá un título o seleccioná al menos un filtro',
  path: ['q'],
});

export function tieneFiltrosAvanzados(filtros = {}) {
  return Boolean(filtros.genero || filtros.actor || filtros.director);
}
