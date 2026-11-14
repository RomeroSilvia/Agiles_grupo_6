import { Router } from 'express';
import { consultaCarteleraSchema } from '@buscador/shared/schemas';
import { CARTELERA_CONFIG } from '../config/tmdb.config.js';
import * as carteleraController from '../controllers/cartelera.controller.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const carteleraRoutes = Router();

carteleraRoutes.get(
  '/',
  rateLimit(CARTELERA_CONFIG.RATE_LIMIT),
  validate({ query: consultaCarteleraSchema }),
  carteleraController.listar,
);
