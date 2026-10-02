import { Router } from 'express';
import * as plataformaController from '../controllers/plataforma.controller.js';
import { plataformaIdParamsSchema } from '../models/plataforma.model.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireSession } from '../middlewares/requireSession.middleware.js';

export const plataformaRoutes = Router();

plataformaRoutes.get('/', plataformaController.listar);
plataformaRoutes.get('/propias', requireSession, plataformaController.listarPropias);
plataformaRoutes.put(
  '/propias/:plataformaId',
  requireSession,
  validate({ params: plataformaIdParamsSchema }),
  plataformaController.agregarPropia,
);
plataformaRoutes.delete(
  '/propias/:plataformaId',
  requireSession,
  validate({ params: plataformaIdParamsSchema }),
  plataformaController.quitarPropia,
);
