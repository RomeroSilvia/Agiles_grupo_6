import { ValidationError } from '../errors/index.js';

/**
 * Valida partes del request con esquemas Zod.
 * En Express 5 `req.query` es de solo lectura, así que los datos
 * ya parseados (con defaults y coerciones aplicados) quedan en `req.validated`.
 *
 * @example
 * router.get('/', validate({ query: busquedaSchema }), busquedaController.buscar);
 * // en el controller: const { q, pagina } = req.validated.query;
 *
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        return next(new ValidationError(result.error));
      }
      validated[part] = result.data;
    }
    req.validated = validated;
    next();
  };
}
