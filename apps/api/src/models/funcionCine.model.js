import { z } from 'zod';
import { ciudadCineIdSchema, tmdbIdSchema, httpUrlSchema } from '@buscador/shared/schemas';

export const lugaresCineConfiguracionSchema = z
  .array(
    z
      .object({
        clave: z.string().trim().min(1),
        ciudadId: ciudadCineIdSchema,
        nombre: z.string().trim().min(1),
        direccion: z.string().trim().min(1),
        evidencia: z.string().trim().min(1),
        urlSitio: z.string().nullable().optional(),
        fuentes: z
          .array(
            z.object({
              fuenteId: z.string().min(1),
              registroId: z.string().nullable(),
              nombre: z.string().optional(),
              direccion: z.string().optional(),
            }),
          )
          .min(1),
      })
      .strict(),
  )
  .refine(
    (lugares) =>
      new Set(lugares.map((lugar) => `${lugar.ciudadId}:${lugar.clave}`)).size === lugares.length,
    'Los lugares deben tener claves únicas por ciudad',
  );

export const correspondenciasPeliculasCineSchema = z.array(
  z
    .object({
      fuenteId: z.string().min(1),
      registroId: z.string().nullable(),
      nombre: z.string().trim().min(1),
      tmdbId: tmdbIdSchema,
      evidencia: z.string().trim().min(1),
      urlEvidencia: httpUrlSchema.optional(),
    })
    .strict(),
);

export const respuestaCinesButacaSchema = z.object({
  data: z.array(
    z.object({
      id: z.number().int(),
      slug: z.string().min(1),
      name: z.string().min(1),
      address: z.string(),
      city: z.string(),
      location: z.object({ name: z.string() }),
    }),
  ),
});
export const respuestaPeliculasButacaSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      corporateId: z.string().min(1),
      title: z.string().min(1),
      openingDate: z.iso.datetime().nullish(),
      runTime: z.number().int().nonnegative().nullish(),
    }),
  ),
});

export const identidadPeliculaTmdbCineSchema = z.object({
  id: tmdbIdSchema,
  title: z.string().min(1),
  original_title: z.string().nullish(),
  release_date: z.string().nullish(),
  runtime: z.number().int().nonnegative().nullish(),
  alternative_titles: z
    .object({ titles: z.array(z.object({ iso_3166_1: z.string(), title: z.string() })) })
    .optional(),
});
export const respuestaFuncionesButacaSchema = z.object({
  data: z.array(
    z.object({
      sessionId: z.string().min(1),
      corporateId: z.string().min(1),
      movieName: z.string().min(1),
      theaterId: z.string().min(1),
      theaterRoom: z.string().nullish(),
      sessionDateTime: z.string(),
      sessionDisplayDate: z.string(),
      sessionFormat: z.string().nullish(),
      language: z.object({ shortName: z.string(), name: z.string() }).nullish(),
    }),
  ),
});
