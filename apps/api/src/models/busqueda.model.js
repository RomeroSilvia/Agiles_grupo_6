import { z } from 'zod';
import { PAGINA_MAXIMA, TIPOS_TITULO } from '@buscador/shared/constants';

const resultadoBusquedaSchema = z.object({
  tmdbId: z.number().int(),
  tipo: z.enum(TIPOS_TITULO),
  nombre: z.string(),
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
