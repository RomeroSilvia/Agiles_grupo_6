import { Router } from 'express';
import { listarCiudadesCine } from '../controllers/ciudadCine.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { listarCiudadesCineQuerySchema } from '@buscador/shared/schemas';

export const ciudadCineRoutes = Router();

ciudadCineRoutes.get('/', validate({ query: listarCiudadesCineQuerySchema }), listarCiudadesCine);
