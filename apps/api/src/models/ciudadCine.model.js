import { z } from 'zod';
import { ciudadCineSchema } from '@buscador/shared/schemas';

const evidenciaFuenteSchema = z.object({
  evidencia: z.string().trim().min(1),
  registroId: z.string().nullable(),
  url: z.url({ protocol: /^https?$/ }).nullable(),
  consultadoEn: z.iso.datetime({ offset: false }),
  actualizadoEn: z.iso.datetime({ offset: false }).nullable(),
});

export const ciudadCineConfiguracionSchema = ciudadCineSchema
  .extend({
    serpApiLocation: z.string().trim().min(1).nullable(),
    butacaCines: z.array(
      z
        .object({
          id: z.union([z.string().trim().min(1), z.number().int().positive()]),
          slug: z.string().trim().min(1),
        })
        .strict(),
    ),
    evidenciaPorFuente: z
      .object({
        serpApi: evidenciaFuenteSchema.nullable(),
        butaca: evidenciaFuenteSchema.nullable(),
      })
      .strict(),
  })
  .strict()
  .refine(
    ({ evidenciaPorFuente }) =>
      evidenciaPorFuente.serpApi !== null || evidenciaPorFuente.butaca !== null,
    'La ciudad requiere evidencia de al menos una fuente',
  )
  .refine(
    ({ cobertura, serpApiLocation, butacaCines }) =>
      cobertura !== 'disponible' || serpApiLocation !== null || butacaCines.length > 0,
    'La cobertura disponible requiere un mapeo de proveedor',
  )
  .refine(({ fuente, evidenciaPorFuente }) => {
    const evidencia = evidenciaPorFuente[fuente.fuenteId === 'serpapi' ? 'serpApi' : 'butaca'];
    return (
      evidencia !== null &&
      evidencia !== undefined &&
      fuente.registroId === evidencia.registroId &&
      fuente.url === evidencia.url &&
      fuente.consultadoEn === evidencia.consultadoEn &&
      fuente.actualizadoEn === evidencia.actualizadoEn &&
      ['serpapi', 'butaca'].includes(fuente.fuenteId)
    );
  }, 'La procedencia pública debe coincidir con la evidencia de su fuente');
