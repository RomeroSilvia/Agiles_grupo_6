import { Router } from 'express';
import { consultaEventosSchema } from '@buscador/shared/schemas';
import * as eventoController from '../controllers/evento.controller.js';
import { EVENTOS_CONFIG } from '../config/eventos.config.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const eventoRoutes = Router();
eventoRoutes.get(
  '/',
  rateLimit(EVENTOS_CONFIG.RATE_LIMIT),
  validate({ query: consultaEventosSchema }),
  eventoController.listar,
);
