import { z } from 'zod';
import { ROLES_USUARIO } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

// Cada consulta lee solo la columna que usa: así un rol que no esté en ROLES_USUARIO
// hace fallar el control del panel y no la detección de región.
export const PERFIL_REGION_COLUMNS = 'region';
export const PERFIL_ROL_COLUMNS = 'rol';

export const perfilSchema = z.object({
  region: regionSchema.nullable(),
  rol: z.enum(ROLES_USUARIO),
});

/** Valida solo las columnas que trae la fila. */
export function fromRow(row) {
  return perfilSchema.partial().parse(row);
}
