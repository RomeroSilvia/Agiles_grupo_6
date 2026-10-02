import { Router } from 'express';
import { busquedaSchema } from '@buscador/shared/schemas';
import * as busquedaController from '../controllers/busqueda.controller.js';
import { validate } from '../middlewares/validate.middleware.js';

export const busquedaRoutes = Router();

busquedaRoutes.get('/', validate({ query: busquedaSchema }), busquedaController.buscar);
