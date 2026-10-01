import { AppError, NotFoundError } from '../errors/index.js';

export function notFoundHandler(req, _res, next) {
  next(new NotFoundError(`No existe la ruta ${req.method} ${req.originalUrl}`));
}

// Express reconoce el manejador de errores por tener 4 parámetros: no quitar `_next`.
export function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    if (error.status >= 500) {
      console.error(error, error.cause);
    }
    return res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
  }

  // JSON mal formado en el body
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El cuerpo del request no es JSON válido' },
    });
  }

  console.error(error);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Ocurrió un error inesperado' },
  });
}
