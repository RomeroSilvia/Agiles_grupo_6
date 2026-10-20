import { request } from '../../services/api.service.js';
import { RUTAS_API_AUTH } from './auth.constants.js';

export function solicitarRecuperacion(email) {
  return request(RUTAS_API_AUTH.RECUPERAR_PASSWORD, { method: 'POST', body: { email } });
}

export function restablecerPassword({ token, password }) {
  return request(RUTAS_API_AUTH.RESTABLECER_PASSWORD, {
    method: 'POST',
    body: { token, password },
  });
}
