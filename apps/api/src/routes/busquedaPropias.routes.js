import { Router } from 'express';
import { busquedaSchema } from '@buscador/shared/schemas';
import * as busquedaPropiasController from '../controllers/busquedaPropias.controller.js';
import { detectRegion } from '../middlewares/detectRegion.middleware.js';
import { requireSession } from '../middlewares/requireSession.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const busquedaPropiasRoutes = Router();

busquedaPropiasRoutes.get(
  '/',
  requireSession,
  validate({ query: busquedaSchema }),
  detectRegion,
  busquedaPropiasController.buscar,
);
