import { z } from 'zod';
import { ANIO_MAXIMO, ANIO_MINIMO, TIPOS_TITULO } from '../constants/index.js';

export const busquedaSchema = z.object({
  q: z.string().trim().min(1, 'Ingresá un título para buscar').max(100),
  tipo: z.enum(TIPOS_TITULO).optional(),
  anio: z.coerce.number().int().min(ANIO_MINIMO).max(ANIO_MAXIMO).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
});

export const resultadoBusquedaSchema = z.object({
  tmdbId: z.number().int(),
  tipo: z.enum(TIPOS_TITULO),
  nombre: z.string(),
  anio: z.number().int().nullable(),
  posterPath: z.string().nullable(),
  puntuacion: z.number().min(0).max(10).nullable(),
});

export const respuestaBusquedaSchema = z.object({
  resultados: z.array(resultadoBusquedaSchema),
  pagina: z.number().int().min(1),
  totalResultados: z.number().int().min(0),
  totalPaginas: z.number().int().min(0),
});
