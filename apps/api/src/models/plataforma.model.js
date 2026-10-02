import { z } from 'zod';

export const PLATAFORMA_COLUMNS = 'id, tmdb_provider_id, nombre, logo_path, url_home';

const POSTGRES_INTEGER_MAX = 2_147_483_647;
const PLATAFORMA_INVALIDA = 'La plataforma no es válida';

export function fromRow(row) {
  return {
    id: row.id,
    tmdbProviderId: row.tmdb_provider_id,
    nombre: row.nombre,
    logoPath: row.logo_path,
    urlHome: row.url_home,
  };
}

export const plataformaIdParamsSchema = z.object({
  plataformaId: z
    .string()
    .regex(/^[1-9]\d{0,9}$/, PLATAFORMA_INVALIDA)
    .transform(Number)
    .pipe(z.number().max(POSTGRES_INTEGER_MAX, PLATAFORMA_INVALIDA)),
});
