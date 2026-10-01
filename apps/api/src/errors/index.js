export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL', details, cause } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(error) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'general',
      message: issue.message,
    }));

    super('Revisá los datos ingresados', {
      status: 400,
      code: 'VALIDATION',
      details,
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, cause) {
    super(`No se pudo consultar ${service}`, {
      status: 502,
      code: 'EXTERNAL_SERVICE',
      cause,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, { status: 404, code: 'NOT_FOUND' });
  }
}
