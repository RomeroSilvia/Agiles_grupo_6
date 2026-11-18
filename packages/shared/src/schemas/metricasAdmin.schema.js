import { z } from 'zod';
import { PERIODO_METRICAS, PERIODOS_METRICAS } from '../constants/index.js';

export const metricasAdminSchema = z
  .object({ periodo: z.enum(PERIODOS_METRICAS).default(PERIODO_METRICAS.TREINTA_DIAS) })
  .strict();
