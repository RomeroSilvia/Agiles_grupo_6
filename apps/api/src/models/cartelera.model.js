import { z } from 'zod';
import { PAGINA_MAXIMA } from '@buscador/shared/constants';
import { fechaCivilCarteleraSchema, peliculaCarteleraSchema } from '@buscador/shared/schemas';

export const respuestaTmdbCarteleraSchema = z.object({
  resultados: z.array(
    peliculaCarteleraSchema.pick({
      tmdbId: true,
      tipo: true,
      nombre: true,
      posterUrl: true,
      anio: true,
      puntuacion: true,
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
            .union([fechaCivilCarteleraSchema, z.iso.datetime({ offset: true })])
            .transform((fecha) => fecha.slice(0, 10))
            .pipe(fechaCivilCarteleraSchema),
          type: z.number().int(),
        }),
      ),
    }),
  ),
});

export const respuestaVentanaEstrenosSchema = z
  .object({
    minimum: fechaCivilCarteleraSchema,
    maximum: fechaCivilCarteleraSchema,
  })
  .refine(({ minimum, maximum }) => minimum <= maximum);

export function crearRespuestaDetallePeliculaSchema(tmdbId) {
  return z.object({
    id: z.literal(tmdbId),
    release_date: z.string().nullish(),
    release_dates: respuestaFechasEstrenoSchema,
  });
}

export const respuestaIdsCarteleraSchema = z.object({
  page: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
  results: z.array(z.object({ id: peliculaCarteleraSchema.shape.tmdbId })),
});
