import { Router } from 'express';
import * as regionController from '../controllers/region.controller.js';
import { loadSession } from '../middlewares/loadSession.middleware.js';
import { detectRegion } from '../middlewares/detectRegion.middleware.js';

export const regionRoutes = Router();

regionRoutes.get('/', loadSession, detectRegion, regionController.obtener);
