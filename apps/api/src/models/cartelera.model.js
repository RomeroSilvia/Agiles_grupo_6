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

export const fechaEstrenoArgentinaSchema = z.object({
  fechaEstrenoAr: fechaCivilCarteleraSchema.nullable(),
  consultadoEn: z.iso.datetime({ offset: false }),
});
