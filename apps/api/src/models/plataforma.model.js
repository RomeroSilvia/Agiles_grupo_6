import { z } from 'zod';

export const PLATAFORMA_COLUMNS = 'id, tmdb_provider_id, nombre, logo_path, url_home';

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
  plataformaId: z.coerce
    .number('La plataforma no es válida')
    .int('La plataforma no es válida')
    .positive('La plataforma no es válida'),
});
