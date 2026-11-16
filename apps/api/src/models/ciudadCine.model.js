import { z } from 'zod';
import { COBERTURA_CIUDAD_CINE, FUENTE_ID_BUTACA } from '@buscador/shared/constants';
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
      cobertura === COBERTURA_CIUDAD_CINE.SIN_COBERTURA ||
      (butacaCines.length > 0 && fuente.fuenteId === FUENTE_ID_BUTACA),
    'La ciudad consultable requiere sucursales y procedencia del proveedor',
  );
