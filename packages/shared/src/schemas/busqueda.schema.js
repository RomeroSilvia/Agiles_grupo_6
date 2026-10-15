import { z } from 'zod';
import { ANIO_MAXIMO, ANIO_MINIMO, PAGINA_MAXIMA, TIPOS_TITULO } from '../constants/index.js';

export const busquedaSchema = z.object({
  q: z.string().trim().min(1, 'Ingresá un título para buscar').max(100),
  tipo: z.enum(TIPOS_TITULO).optional(),
  anio: z.coerce
    .number()
    .int('El año debe ser un número entero')
    .min(ANIO_MINIMO, `El año debe ser mayor o igual a ${ANIO_MINIMO}`)
    .max(ANIO_MAXIMO, `El año debe ser menor o igual a ${ANIO_MAXIMO}`)
    .optional(),
  pagina: z.coerce.number().int().min(1).max(PAGINA_MAXIMA).default(1),
});
