import { API_ERROR_CODES } from '../../services/api.service.js';

export function separarErrorPassword(error) {
  const esDePassword = error?.code === API_ERROR_CODES.FORBIDDEN;
  return {
    errorPassword: esDePassword ? error.message : undefined,
    errorGeneral: esDePassword ? '' : error?.message,
  };
}
