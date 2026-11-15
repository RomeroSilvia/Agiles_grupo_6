import { z } from 'zod';
import { ciudadCineSchema } from '@buscador/shared/schemas';

export const ciudadCineConfiguracionSchema = ciudadCineSchema
  .extend({
    butacaCines: z.array(
      z
        .object({
          id: z.union([z.string().trim().min(1), z.number().int().positive()]),
          slug: z.string().trim().min(1),
        })
        .strict(),
    ),
  })
  .strict()
  .refine(
    ({ cobertura, butacaCines, fuente }) =>
      cobertura === 'sin_cobertura' || (butacaCines.length > 0 && fuente.fuenteId === 'butaca'),
    'La ciudad consultable requiere sucursales y procedencia del proveedor',
  );
