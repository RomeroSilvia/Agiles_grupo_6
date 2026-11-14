import { z } from 'zod';
import { fuenteSchema } from './cartelera.schema.js';

const uuidSchema = z.uuid();

export const ciudadCineIdSchema = z
  .string()
  .length(39, 'El identificador de ciudad no es válido')
  .refine((id) => id.startsWith('ar:') && uuidSchema.safeParse(id.slice(3)).success, {
    message: 'El identificador de ciudad no es válido',
  });

export const zonaHorariaCineSchema = z
  .string()
  .trim()
  .min(1, 'La zona horaria es obligatoria')
  .refine((zonaHoraria) => {
    if (zonaHoraria !== 'UTC' && !zonaHoraria.includes('/')) {
      return false;
    }

    try {
      new Intl.DateTimeFormat('es', { timeZone: zonaHoraria });
      return true;
    } catch {
      return false;
    }
  }, 'La zona horaria debe ser un identificador IANA válido');

export const ciudadCineFuenteSchema = fuenteSchema.strict();

export const ciudadCineSchema = z
  .object({
    id: ciudadCineIdSchema,
    nombre: z.string().trim().min(1, 'El nombre de la ciudad es obligatorio'),
    provincia: z.string().trim().min(1, 'La provincia es obligatoria'),
    pais: z.literal('AR'),
    zonaHoraria: zonaHorariaCineSchema,
    cobertura: z.enum(['disponible', 'sin_cobertura']),
    fuente: ciudadCineFuenteSchema,
  })
  .strict();

export const respuestaCiudadesCineSchema = z
  .object({
    pais: z.literal('AR'),
    ciudades: z.array(ciudadCineSchema),
  })
  .strict();

export const listarCiudadesCineQuerySchema = z.object({}).strict();
