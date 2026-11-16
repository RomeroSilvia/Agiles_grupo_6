import { Router } from 'express';
import { tituloParamsSchema } from '@buscador/shared/schemas';
import * as watchlistController from '../controllers/watchlist.controller.js';
import { requireSession } from '../middlewares/requireSession.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { watchlistQuerySchema } from '../models/watchlist.model.js';

export const watchlistRoutes = Router();

watchlistRoutes.use(requireSession);
watchlistRoutes.get('/', validate({ query: watchlistQuerySchema }), watchlistController.listar);
watchlistRoutes.get(
  '/:tipo/:tmdbId',
  validate({ params: tituloParamsSchema }),
  watchlistController.obtenerEstado,
);
watchlistRoutes.put(
  '/:tipo/:tmdbId',
  validate({ params: tituloParamsSchema }),
  watchlistController.agregar,
);
watchlistRoutes.delete(
  '/:tipo/:tmdbId',
  validate({ params: tituloParamsSchema }),
  watchlistController.quitar,
);
