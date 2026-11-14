import { Router } from 'express';
import {
  consultaFuncionesCineSchema,
  parametrosFuncionesCineSchema,
} from '@buscador/shared/schemas';
import * as funcionCineController from '../controllers/funcionCine.controller.js';
import { FUNCIONES_CINE_CONFIG } from '../config/funcionesCine.config.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const funcionCineRoutes = Router();
funcionCineRoutes.get(
  '/peliculas/:tmdbId/funciones',
  rateLimit(FUNCIONES_CINE_CONFIG.RATE_LIMIT),
  validate({ params: parametrosFuncionesCineSchema, query: consultaFuncionesCineSchema }),
  funcionCineController.obtenerFunciones,
);
