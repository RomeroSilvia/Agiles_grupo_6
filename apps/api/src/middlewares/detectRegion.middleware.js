import { env } from '../config/env.config.js';

/**
 * Deja en `req.region` el código de país del usuario.
 * TODO (E2HU1): detectar por IP con integrations/geoip.integration.js y usar la región
 * por defecto solo como respaldo. Considerar `app.set('trust proxy', ...)` en producción.
 */
export function detectRegion(req, _res, next) {
  req.region = env.DEFAULT_REGION;
  next();
}
