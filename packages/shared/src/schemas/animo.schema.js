import { z } from 'zod';
import { ESTADOS_ANIMO_IDS, PAGINA_MAXIMA } from '../constants/index.js';

export const busquedaAnimoSchema = z
  .object({
    animo: z.enum(ESTADOS_ANIMO_IDS, { message: 'Elegí un estado de ánimo de la lista' }),
    pagina: z.coerce.number().int().min(1).max(PAGINA_MAXIMA).default(1),
  })
  .strict();
