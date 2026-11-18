import { Router } from 'express';
import { busquedaAnimoSchema } from '@buscador/shared/schemas';
import { ANIMO_CONFIG } from '../config/animo.config.js';
import * as animoController from '../controllers/animo.controller.js';
import { detectRegion } from '../middlewares/detectRegion.middleware.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';
import { requireSession } from '../middlewares/requireSession.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const animoRoutes = Router();

const limitarBusquedaAnimo = rateLimit(ANIMO_CONFIG.RATE_LIMIT);

animoRoutes.get(
  '/propias',
  limitarBusquedaAnimo,
  requireSession,
  validate({ query: busquedaAnimoSchema }),
  detectRegion,
  animoController.buscarEnPlataformasPropias,
);
animoRoutes.get(
  '/',
  limitarBusquedaAnimo,
  validate({ query: busquedaAnimoSchema }),
  animoController.buscar,
);
