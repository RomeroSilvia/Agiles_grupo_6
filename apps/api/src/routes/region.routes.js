import { Router } from 'express';
import * as regionController from '../controllers/region.controller.js';

export const regionRoutes = Router();

regionRoutes.get('/', regionController.obtener);
