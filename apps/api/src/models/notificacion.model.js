import { z } from 'zod';
import { TIPOS_TITULO } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

export const NOTIFICACION_POR_ENVIAR_COLUMNS =
  'id, usuario_id, region, intentos, creada_en, titulo!inner(id, tmdb_id, tipo, nombre, anio), plataforma!inner(id, nombre)';

const notificacionRowSchema = z.object({
  id: z.number().int().positive(),
  usuario_id: z.uuid(),
  region: regionSchema,
  intentos: z.number().int().nonnegative(),
  creada_en: z.string(),
  titulo: z.object({
    id: z.number().int().positive(),
    tmdb_id: z.number().int().positive(),
    tipo: z.enum(TIPOS_TITULO),
    nombre: z.string(),
    anio: z.number().int().nullable(),
  }),
  plataforma: z.object({ id: z.number().int().positive(), nombre: z.string() }),
});

export function fromRow(row) {
  const data = notificacionRowSchema.parse(row);

  return {
    id: data.id,
    usuarioId: data.usuario_id,
    region: data.region,
    intentos: data.intentos,
    creadaEn: data.creada_en,
    titulo: {
      id: data.titulo.id,
      tmdbId: data.titulo.tmdb_id,
      tipo: data.titulo.tipo,
      nombre: data.titulo.nombre,
      anio: data.titulo.anio,
    },
    plataforma: { id: data.plataforma.id, nombre: data.plataforma.nombre },
  };
}
