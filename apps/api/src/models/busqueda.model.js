import { z } from 'zod';
import { PAGINA_MAXIMA, TIPOS_TITULO } from '@buscador/shared/constants';

const resultadoBusquedaSchema = z.object({
  tmdbId: z.number().int(),
  tipo: z.enum(TIPOS_TITULO),
  nombre: z.string().nullable(),
  anio: z.number().int().nullable(),
  posterUrl: z.url().nullable(),
  puntuacion: z.number().min(0).max(10).nullable(),
  // Se usa para ordenar en el service y no se envía al cliente.
  relevancia: z.number().min(0).optional(),
});

export const respuestaBusquedaSchema = z.object({
  resultados: z.array(resultadoBusquedaSchema),
  pagina: z.number().int().min(1).max(PAGINA_MAXIMA),
  totalResultados: z.number().int().min(0),
  totalPaginas: z.number().int().min(0),
});

export const resultadoTmdbBusquedaSchema = z.object({
  tmdbId: z.number().int().min(1),
  tipo: z.enum(TIPOS_TITULO),
  nombre: z.string().nullable(),
  posterUrl: z.url().nullable(),
  anio: z.number().int().nullable(),
  puntuacion: z.number().min(0).max(10).nullable(),
  relevancia: z.number().min(0),
  generoIds: z.array(z.number().int().min(1)),
  fecha: z.string().nullable(),
});

export const respuestaTmdbBusquedaSchema = z.object({
  resultados: z.array(resultadoTmdbBusquedaSchema),
  pagina: z.number().int().min(1).max(PAGINA_MAXIMA),
  totalResultados: z.number().int().min(0),
  totalPaginas: z.number().int().min(0),
});

export const creditosPersonaSchema = z.object({
  cast: z.array(resultadoTmdbBusquedaSchema),
  crew: z.array(resultadoTmdbBusquedaSchema.extend({ puesto: z.string().nullable().optional() })),
});
