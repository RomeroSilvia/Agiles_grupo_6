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
              fuenteId: z.enum(['serpapi', 'butaca']),
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
      fuenteId: z.enum(['serpapi', 'butaca']),
      registroId: z.string().nullable(),
      nombre: z.string().trim().min(1),
      tmdbId: tmdbIdSchema,
      evidencia: z.string().trim().min(1),
      urlEvidencia: httpUrlSchema.optional(),
    })
    .strict(),
);

const showingSchema = z.object({
  time: z.array(z.string()),
  type: z.string().nullish(),
});
const teatroSerpSchema = z.object({
  name: z.string().min(1),
  address: z.string().nullish(),
  link: z.string().nullish(),
  showing: z.array(showingSchema),
});
export const respuestaSerpApiSchema = z
  .object({
    error: z.string().optional(),
    search_metadata: z.object({ status: z.string() }).optional(),
    knowledge_graph: z
      .object({ title: z.string().optional(), kgmid: z.string().optional() })
      .optional(),
    showtimes: z
      .array(
        z.object({
          day: z.string().nullish(),
          date: z.string().nullish(),
          theaters: z.array(teatroSerpSchema).optional(),
          movies: z
            .array(z.object({ name: z.string().min(1), showing: z.array(showingSchema) }))
            .optional(),
        }),
      )
      .optional(),
  })
  .refine(
    (respuesta) => Boolean(respuesta.error) || respuesta.search_metadata?.status === 'Success',
    'La respuesta debe acreditar éxito o informar un error',
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
    }),
  ),
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
