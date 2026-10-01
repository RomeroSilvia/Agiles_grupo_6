import { Router } from 'express';
import { busquedaRoutes } from './busqueda.routes.js';

export const routes = Router();

routes.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
routes.use('/busqueda', busquedaRoutes);
