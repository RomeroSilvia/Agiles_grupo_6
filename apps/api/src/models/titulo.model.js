import { z } from 'zod';
import { TIPOS_TITULO } from '@buscador/shared/constants';

export const tituloSchema = z.object({
  tmdbId: z.number().int().positive(),
  tipo: z.enum(TIPOS_TITULO),
  nombre: z.string().nullable(),
  sinopsis: z.string().nullable(),
  posterUrl: z.url().nullable(),
  anio: z.number().int().nullable(),
  puntuacion: z.number().min(0).max(10).nullable(),
});
