import { z } from 'zod';
import { ESTADOS_USUARIO, PAGINA_MAXIMA_USUARIOS } from '../constants/index.js';
import { regionSchema } from './region.schema.js';

export const usuariosAdminSchema = z
  .object({
    mail: z.string().trim().max(100).optional(),
    region: regionSchema.optional(),
    estado: z.enum(ESTADOS_USUARIO).optional(),
    pagina: z.coerce.number().int().min(1).max(PAGINA_MAXIMA_USUARIOS).default(1),
  })
  .strict();
