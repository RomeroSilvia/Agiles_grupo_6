import { z } from 'zod';
import { ROLES_USUARIO } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

export const PERFIL_COLUMNS = 'region, rol';

export const perfilSchema = z.object({
  region: regionSchema.nullable(),
  rol: z.enum(ROLES_USUARIO),
});

export function fromRow(row) {
  return perfilSchema.parse({ region: row.region, rol: row.rol });
}
