import { z } from 'zod';
import {
  ESTADOS_USUARIO,
  MAX_LARGO_BUSQUEDA_MAIL,
  PAGINA_MAXIMA_USUARIOS,
} from '../constants/index.js';
import { regionSoportadaSchema } from './region.schema.js';

export const usuariosAdminSchema = z
  .object({
    mail: z.string().trim().max(MAX_LARGO_BUSQUEDA_MAIL).optional(),
    // Solo las regiones soportadas, las mismas que ofrece el filtro de la web
    region: regionSoportadaSchema.optional(),
    estado: z.enum(ESTADOS_USUARIO).optional(),
    pagina: z.coerce.number().int().min(1).max(PAGINA_MAXIMA_USUARIOS).default(1),
  })
  .strict();
