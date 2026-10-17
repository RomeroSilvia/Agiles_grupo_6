import { z } from 'zod';
import { TIPOS_TITULO } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

export const TITULOS_WATCHLIST_PARA_SINCRONIZAR_COLUMNS =
  'titulo!inner(id, tmdb_id, tipo), perfil!inner(region)';

const tituloWatchlistRowSchema = z.object({
  titulo: z.object({
    id: z.number().int().positive(),
    tmdb_id: z.number().int().positive(),
    tipo: z.enum(TIPOS_TITULO),
  }),
  perfil: z.object({ region: regionSchema.nullable() }),
});

export function fromActiveWatchlistRow(row, regionPredeterminada) {
  const data = tituloWatchlistRowSchema.parse(row);

  return {
    tituloId: data.titulo.id,
    tmdbId: data.titulo.tmdb_id,
    tipo: data.titulo.tipo,
    region: data.perfil.region ?? regionPredeterminada,
  };
}
