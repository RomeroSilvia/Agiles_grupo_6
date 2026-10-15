import * as regionService from '../services/region.service.js';

/** Resuelve la región solo en las rutas que la necesitan. */
export async function detectRegion(req, _res, next) {
  const { region, source } = await regionService.obtenerRegion({
    usuarioId: req.user?.id,
    ip: req.ip,
  });
  req.region = region;
  req.regionSource = source;
  next();
}
