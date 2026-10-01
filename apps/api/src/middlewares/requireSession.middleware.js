import { UnauthenticatedError } from '../errors/index.js';
import { loadSession } from './loadSession.middleware.js';

/**
 * Exige un usuario autenticado. Deja `req.user = { id, email }`.
 *
 * @example
 * watchlistRoutes.use(requireSession);
 */
export async function requireSession(req, res, next) {
  await loadSession(req, res, () => {});

  if (!req.user) {
    throw new UnauthenticatedError();
  }
  next();
}
