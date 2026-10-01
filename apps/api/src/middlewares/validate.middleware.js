import { ValidationError } from '../errors/index.js';

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
