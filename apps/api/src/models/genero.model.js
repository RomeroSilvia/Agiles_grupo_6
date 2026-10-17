import { z } from 'zod';
import { TMDB_ID_MAXIMO } from '@buscador/shared/constants';

export const generoSchema = z.object({
  id: z.number().int().min(1).max(TMDB_ID_MAXIMO),
  nombre: z.string().trim().min(1),
});
