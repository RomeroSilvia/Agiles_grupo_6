import { z } from 'zod';
import { Router } from 'express';
import { REGION_PATTERN, TIPOS_TITULO } from '@buscador/shared/constants';
import { comparacionDisponibilidadQuerySchema } from '@buscador/shared/schemas';
import { STREAMING_AVAILABILITY_CONFIG } from '../config/streamingAvailability.config.js';
import * as tituloController from '../controllers/titulo.controller.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';
import { requireSession } from '../middlewares/requireSession.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const tituloParamsSchema = z.object({
  tipo: z.enum(TIPOS_TITULO),
  tmdbId: z.coerce.number().int().positive(),
});

const tituloQuerySchema = z.object({
  region: z.string().regex(REGION_PATTERN).optional(),
});

export const tituloRoutes = Router();

const limitarDisponibilidad = rateLimit(STREAMING_AVAILABILITY_CONFIG.RATE_LIMIT_DISPONIBILIDAD);
const limitarComparacion = rateLimit(STREAMING_AVAILABILITY_CONFIG.RATE_LIMIT_DISPONIBILIDAD);

tituloRoutes.get(
  '/:tipo/:tmdbId/disponibilidad/comparacion',
  limitarComparacion,
  requireSession,
  validate({ params: tituloParamsSchema, query: comparacionDisponibilidadQuerySchema }),
  tituloController.compararDisponibilidad,
);

tituloRoutes.get(
  '/:tipo/:tmdbId/disponibilidad',
  limitarDisponibilidad,
  validate({ params: tituloParamsSchema, query: tituloQuerySchema }),
  tituloController.obtenerDisponibilidad,
);

tituloRoutes.get(
  '/:tipo/:tmdbId',
  validate({ params: tituloParamsSchema }),
  tituloController.obtenerDetalle,
);
