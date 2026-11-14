import { ForbiddenError } from '../errors/index.js';
import * as perfilService from '../services/perfil.service.js';
import { requireSession } from './requireSession.middleware.js';

/**
 * Exige sesión y rol de administrador. Sin sesión: 401. Sin el rol: 403.
 * El rol se lee de la base en cada request, así que quitarlo corta el acceso enseguida.
 *
 * @example
 * adminRoutes.use(noStore, requireAdmin);
 */
export async function requireAdmin(req, res, next) {
  await requireSession(req, res, () => {});

  if (!(await perfilService.esAdministrador(req.user.id))) {
    throw new ForbiddenError('No tenés permiso para acceder a esta sección');
  }
  next();
}
