import { z } from 'zod';
import { regionSchema } from '@buscador/shared/schemas';

export const PERFIL_COLUMNS = 'region';

export const perfilSchema = z.object({ region: regionSchema.nullable() });

export function fromRow(row) {
  return perfilSchema.parse({ region: row.region });
}
