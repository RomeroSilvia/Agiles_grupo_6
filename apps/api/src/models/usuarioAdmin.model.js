import { z } from 'zod';
import { ESTADOS_USUARIO } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

const usuarioAdminRowSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  region: regionSchema.nullable(),
  plataforma_ids: z.array(z.number().int().positive()),
  titulos_watchlist: z.number().int().min(0),
  creado_en: z.string(),
  estado: z.enum(ESTADOS_USUARIO),
});

export function fromRow(row) {
  const data = usuarioAdminRowSchema.parse(row);

  return {
    id: data.id,
    email: data.email,
    region: data.region,
    plataformaIds: data.plataforma_ids,
    titulosWatchlist: data.titulos_watchlist,
    creadoEn: data.creado_en,
    estado: data.estado,
  };
}
