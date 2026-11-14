/**
 * Evita que la respuesta se guarde en caché. Para rutas con datos sensibles.
 *
 * @example
 * adminRoutes.use(noStore, requireAdmin);
 */
export function noStore(_req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}
