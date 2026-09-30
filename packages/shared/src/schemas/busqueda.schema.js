import { z } from 'zod';
import { TIPOS_TITULO } from '../constants/index.js';

export const busquedaSchema = z.object({
  q: z.string().trim().min(1, 'Ingresá un título para buscar').max(100),
  tipo: z.enum(TIPOS_TITULO).optional(),
  anio: z.coerce.number().int().min(1888).max(2100).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
});
