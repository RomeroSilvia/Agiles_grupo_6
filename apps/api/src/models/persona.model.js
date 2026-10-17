import { z } from 'zod';
import { TMDB_ID_MAXIMO } from '@buscador/shared/constants';

export const personaSchema = z.object({
  id: z.number().int().min(1).max(TMDB_ID_MAXIMO),
  nombre: z.string().trim().min(1),
  fotoUrl: z.url().nullable(),
  departamentoConocido: z.string().nullable().optional(),
});

export const respuestaCreditosCombinadosSchema = z.object({
  cast: z.array(z.object({ id: z.number().int().min(1).max(TMDB_ID_MAXIMO) })),
  crew: z.array(
    z.object({
      id: z.number().int().min(1).max(TMDB_ID_MAXIMO),
      job: z.string().nullable().optional(),
    }),
  ),
});
