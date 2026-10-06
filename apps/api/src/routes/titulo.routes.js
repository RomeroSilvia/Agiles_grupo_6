import { z } from 'zod';
import { Router } from 'express';
import { TIPOS_TITULO } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';
import * as tituloController from '../controllers/titulo.controller.js';
import { validate } from '../middlewares/validate.middleware.js';

const tituloParamsSchema = z.object({
  tipo: z.enum(TIPOS_TITULO),
  tmdbId: z.coerce.number().int().positive(),
});

export const tituloRoutes = Router();

tituloRoutes.get(
  '/:tipo/:tmdbId/disponibilidad',
  validate({ params: tituloParamsSchema, query: z.object({ region: regionSchema }) }),
  tituloController.obtenerDisponibilidad,
);

tituloRoutes.get(
  '/:tipo/:tmdbId',
  validate({ params: tituloParamsSchema }),
  tituloController.obtenerDetalle,
);
