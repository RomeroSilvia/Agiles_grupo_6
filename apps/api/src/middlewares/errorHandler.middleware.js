import { AppError, NotFoundError } from '../errors/index.js';

export function notFoundHandler(req, _res, next) {
  next(new NotFoundError(`No existe la ruta ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    if (error.status >= 500) {
      console.error(error, error.cause);
    }

    const response = {
      error: {
        code: error.code,
        message: error.message,
      },
    };

    if (error.details !== undefined) {
      response.error.details = error.details;
    }

    return res.status(error.status).json(response);
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: { code: 'VALIDATION', message: 'El cuerpo de la solicitud no es válido' },
    });
  }

  console.error(error);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Ocurrió un error inesperado' },
  });
}
