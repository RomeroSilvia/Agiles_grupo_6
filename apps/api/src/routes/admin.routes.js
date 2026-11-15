import { Router } from 'express';
import { usuariosAdminSchema } from '@buscador/shared/schemas';
import * as usuarioAdminController from '../controllers/usuarioAdmin.controller.js';
import { noStore } from '../middlewares/noStore.middleware.js';
import { requireAdmin } from '../middlewares/requireAdmin.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

export const adminRoutes = Router();

// noStore va primero para que también lleven el encabezado las respuestas 401 y 403
adminRoutes.use(noStore, requireAdmin);

adminRoutes.get(
  '/usuarios',
  validate({ query: usuariosAdminSchema }),
  usuarioAdminController.listarUsuarios,
);
