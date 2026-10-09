import { z } from 'zod';
import { TIPOS_OFERTA } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

export const disponibilidadSchema = z.object({
  region: regionSchema,
  ofertas: z.array(
    z.object({
      tipoOferta: z.enum(TIPOS_OFERTA),
      plataformas: z.array(
        z.object({
          id: z.number().int().positive(),
          tmdbProviderId: z.number().int().positive(),
          nombre: z.string().min(1),
          logoPath: z.string().min(1).nullable(),
          urlHome: z.url().nullable(),
        }),
      ),
    }),
  ),
  enlaceTmdb: z.url().nullable(),
});
