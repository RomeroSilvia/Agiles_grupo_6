import { Router } from 'express';
import {
  consultaCarteleraSchema,
  consultaEstrenosSchema,
  parametrosFuncionesCineSchema,
} from '@buscador/shared/schemas';
import { CARTELERA_CONFIG } from '../config/tmdb.config.js';
import * as carteleraController from '../controllers/cartelera.controller.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

import { ciudadCineRoutes } from './ciudadCine.routes.js';
import { funcionCineRoutes } from './funcionCine.routes.js';

export const carteleraRoutes = Router();
carteleraRoutes.use('/ciudades', ciudadCineRoutes);
carteleraRoutes.use(funcionCineRoutes);

carteleraRoutes.get(
  '/estrenos',
  rateLimit(CARTELERA_CONFIG.RATE_LIMIT),
  validate({ query: consultaEstrenosSchema }),
  carteleraController.listarEstrenos,
);

carteleraRoutes.get(
  '/',
  rateLimit(CARTELERA_CONFIG.RATE_LIMIT),
  validate({ query: consultaCarteleraSchema }),
  carteleraController.listar,
);

carteleraRoutes.get(
  '/peliculas/:tmdbId/exhibicion',
  rateLimit(CARTELERA_CONFIG.RATE_LIMIT),
  validate({ params: parametrosFuncionesCineSchema }),
  carteleraController.obtenerExhibicion,
);
