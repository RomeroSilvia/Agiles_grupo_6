import { Router } from 'express';
import { z } from 'zod';
import { busquedaSchema } from '@buscador/shared/schemas';
import * as busquedaController from '../controllers/busqueda.controller.js';
import { validate } from '../middlewares/validate.middleware.js';

export const busquedaRoutes = Router();

const personasBusquedaSchema = z.object({
  q: z.string().trim().min(2, 'Ingresá al menos dos letras para buscar personas').max(100),
  rol: z.enum(['actor', 'director']),
});

busquedaRoutes.get('/generos', busquedaController.listarGeneros);
busquedaRoutes.get(
  '/personas',
  validate({ query: personasBusquedaSchema }),
  busquedaController.buscarPersonas,
);
busquedaRoutes.get('/', validate({ query: busquedaSchema }), busquedaController.buscar);
