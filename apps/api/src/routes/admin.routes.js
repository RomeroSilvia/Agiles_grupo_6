import { Router } from 'express';
import { noStore } from '../middlewares/noStore.middleware.js';
import { requireAdmin } from '../middlewares/requireAdmin.middleware.js';

export const adminRoutes = Router();

// noStore va primero para que también lleven el encabezado las respuestas 401 y 403
adminRoutes.use(noStore, requireAdmin);
