import { Router } from 'express';
import { signInSchema, signUpSchema } from '@buscador/shared/schemas';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loadSession } from '../middlewares/loadSession.middleware.js';

export const authRoutes = Router();

authRoutes.post('/sign-up', validate({ body: signUpSchema }), authController.registrar);
authRoutes.post('/sign-in', validate({ body: signInSchema }), authController.iniciarSesion);
authRoutes.post('/sign-out', authController.cerrarSesion);
authRoutes.get('/session', loadSession, authController.obtenerSesion);
