import { Router } from 'express';
import { busquedaSchema } from '@buscador/shared/schemas';
import * as busquedaPropiasController from '../controllers/busquedaPropias.controller.js';
import { requireSession } from '../middlewares/requireSession.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const busquedaPropiasRoutes = Router();

busquedaPropiasRoutes.get(
  '/',
  requireSession,
  validate({ query: busquedaSchema }),
  busquedaPropiasController.buscar,
);
