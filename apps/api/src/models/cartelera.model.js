import { z } from 'zod';
import { PAGINA_MAXIMA, TIPO_TITULO } from '@buscador/shared/constants';
import { fechaCivilCarteleraSchema } from '@buscador/shared/schemas';

export const respuestaTmdbCarteleraSchema = z.object({
  resultados: z.array(
    z.object({
      tmdbId: z.number().int().min(1),
      tipo: z.literal(TIPO_TITULO.PELICULA),
      nombre: z.string().nullable(),
      posterUrl: z.url().nullable(),
      anio: z.number().int().nullable(),
      puntuacion: z.number().min(0).max(10).nullable(),
    }),
  ),
  pagina: z.number().int().min(1).max(PAGINA_MAXIMA),
  totalResultados: z.number().int().min(0),
  totalPaginas: z.number().int().min(0).max(PAGINA_MAXIMA),
  consultadoEn: z.iso.datetime({ offset: false }),
});

export const respuestaFechasEstrenoSchema = z.object({
  results: z.array(
    z.object({
      iso_3166_1: z.string().length(2),
      release_dates: z.array(
        z.object({
          release_date: z
            .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.iso.datetime({ offset: true })])
            .transform((fecha) => fecha.slice(0, 10))
            .pipe(fechaCivilCarteleraSchema),
          type: z.number().int(),
        }),
      ),
    }),
  ),
});

export function crearRespuestaDetallePeliculaSchema(tmdbId) {
  return z.object({ id: z.literal(tmdbId), release_date: z.string().nullish() });
}
