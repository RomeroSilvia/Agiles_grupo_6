import { Router } from 'express';
import {
  busquedaSchema,
  personaBusquedaSchema,
  personaIdBusquedaSchema,
  personaRolSchema,
} from '@buscador/shared/schemas';
import * as busquedaController from '../controllers/busqueda.controller.js';
import { TMDB_CONFIG } from '../config/tmdb.config.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const busquedaRoutes = Router();

const limitarBusqueda = rateLimit(TMDB_CONFIG.RATE_LIMIT_BUSQUEDA);
const limitarBusquedaPersonas = rateLimit(TMDB_CONFIG.RATE_LIMIT_PERSONAS);

busquedaRoutes.get('/generos', busquedaController.listarGeneros);
busquedaRoutes.get(
  '/personas',
  limitarBusquedaPersonas,
  validate({ query: personaBusquedaSchema }),
  busquedaController.buscarPersonas,
);
busquedaRoutes.get(
  '/personas/:id',
  limitarBusquedaPersonas,
  validate({ params: personaIdBusquedaSchema.pick({ id: true }), query: personaRolSchema }),
  busquedaController.obtenerPersona,
);
busquedaRoutes.get(
  '/',
  limitarBusqueda,
  validate({ query: busquedaSchema }),
  busquedaController.buscar,
);
