export class AppError extends Error {
  /**
   * @param {string} message Mensaje apto para mostrar al usuario (en español)
   * @param {object} [options]
   * @param {number} [options.status] Código HTTP
   * @param {string} [options.code] Código estable para que el front distinga errores
   * @param {unknown} [options.details]
   * @param {unknown} [options.cause] Error original (solo para logs, no se envía al cliente)
   */
  constructor(message, { status = 500, code = 'INTERNAL', details, cause } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  /** @param {import('zod').ZodError} zodError */
  constructor(zodError) {
    super('Los datos enviados no son válidos', {
      status: 400,
      code: 'VALIDATION',
      details: zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Tenés que iniciar sesión') {
    super(message, { status: 401, code: 'UNAUTHENTICATED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tenés permiso para realizar esta acción') {
    super(message, { status: 403, code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, { status: 404, code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe') {
    super(message, { status: 409, code: 'CONFLICT' });
  }
}

export class TooManyAttemptsError extends AppError {
  /** @param {Date} retryAt Desde cuándo se puede volver a intentar */
  constructor(retryAt) {
    const minutes = Math.max(1, Math.ceil((retryAt.getTime() - Date.now()) / 60_000));
    super(
      `Por seguridad bloqueamos el ingreso tras varios intentos fallidos. Probá de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`,
      { status: 429, code: 'TOO_MANY_ATTEMPTS', details: { retryAt: retryAt.toISOString() } },
    );
  }
}

export class DatabaseError extends AppError {
  constructor(cause) {
    super('Error al acceder a los datos', { status: 500, code: 'DATABASE', cause });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, cause) {
    super(`El servicio ${service} no está disponible`, {
      status: 502,
      code: 'EXTERNAL_SERVICE',
      cause,
    });
  }
}
