import { ForbiddenError } from '../errors/index.js';
import * as perfilService from '../services/perfil.service.js';
import { requireSession } from './requireSession.middleware.js';

export async function requireAdmin(req, res, next) {
  await requireSession(req, res, () => {});

  if (!(await perfilService.esAdministrador(req.user.id))) {
    throw new ForbiddenError('No tenés permiso para acceder a esta sección');
  }
  next();
}
