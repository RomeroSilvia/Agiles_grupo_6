import { Router } from 'express';
import {
  accountDeletionSchema,
  emailChangeSchema,
  linkTokenSchema,
  passwordChangeSchema,
  passwordRecoverySchema,
  passwordResetSchema,
  signInSchema,
  signUpSchema,
} from '@buscador/shared/schemas';
import * as authController from '../controllers/auth.controller.js';
import * as cuentaController from '../controllers/cuenta.controller.js';
import { RATE_LIMIT_RECUPERACION } from '../config/cuenta.config.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loadSession } from '../middlewares/loadSession.middleware.js';
import { requireSession } from '../middlewares/requireSession.middleware.js';

export const authRoutes = Router();

const limitarRecuperacion = rateLimit(RATE_LIMIT_RECUPERACION);

authRoutes.post('/sign-up', validate({ body: signUpSchema }), authController.registrar);
authRoutes.post('/sign-in', validate({ body: signInSchema }), authController.iniciarSesion);
authRoutes.post('/sign-out', authController.cerrarSesion);
authRoutes.get('/session', loadSession, authController.obtenerSesion);

authRoutes.post(
  '/password-recovery',
  limitarRecuperacion,
  validate({ body: passwordRecoverySchema }),
  cuentaController.solicitarRecuperacion,
);
authRoutes.post(
  '/password-reset',
  validate({ body: passwordResetSchema }),
  cuentaController.restablecerPassword,
);
authRoutes.post(
  '/password-change',
  requireSession,
  validate({ body: passwordChangeSchema }),
  cuentaController.cambiarPassword,
);
authRoutes.post(
  '/email-change',
  requireSession,
  validate({ body: emailChangeSchema }),
  cuentaController.solicitarCambioMail,
);
authRoutes.post(
  '/email-change/confirm',
  loadSession,
  validate({ body: linkTokenSchema }),
  cuentaController.confirmarCambioMail,
);
authRoutes.delete(
  '/account',
  requireSession,
  validate({ body: accountDeletionSchema }),
  cuentaController.eliminarCuenta,
);
