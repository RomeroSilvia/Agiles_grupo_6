import { Router } from 'express';
import { busquedaRoutes } from './busqueda.routes.js';
import { authRoutes } from './auth.routes.js';
import { regionRoutes } from './region.routes.js';

export const routes = Router();

routes.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
routes.use('/busqueda', busquedaRoutes);
routes.use('/auth', authRoutes);
routes.use('/region', regionRoutes);
