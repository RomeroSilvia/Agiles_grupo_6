import { Router } from 'express';
import * as watchlistController from '../controllers/watchlist.controller.js';
import { requireSession } from '../middlewares/requireSession.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { watchlistParamsSchema } from '../models/watchlist.model.js';

export const watchlistRoutes = Router();

watchlistRoutes.use(requireSession);
watchlistRoutes.get('/', watchlistController.listar);
watchlistRoutes.get(
  '/:tipo/:tmdbId',
  validate({ params: watchlistParamsSchema }),
  watchlistController.obtenerEstado,
);
watchlistRoutes.put(
  '/:tipo/:tmdbId',
  validate({ params: watchlistParamsSchema }),
  watchlistController.agregar,
);
watchlistRoutes.delete(
  '/:tipo/:tmdbId',
  validate({ params: watchlistParamsSchema }),
  watchlistController.quitar,
);
