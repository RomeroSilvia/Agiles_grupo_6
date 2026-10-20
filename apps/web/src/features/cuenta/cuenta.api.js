import { request } from '../../services/api.service.js';
import { RUTAS_API_AUTH } from '../auth/auth.constants.js';

export function cambiarPassword({ currentPassword, newPassword }) {
  return request(RUTAS_API_AUTH.CAMBIAR_PASSWORD, {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export function solicitarCambioMail({ email, password }) {
  return request(RUTAS_API_AUTH.CAMBIAR_MAIL, { method: 'POST', body: { email, password } });
}

export function confirmarCambioMail(token) {
  return request(RUTAS_API_AUTH.CONFIRMAR_MAIL, { method: 'POST', body: { token } });
}

export function eliminarCuenta(confirmacion) {
  return request(RUTAS_API_AUTH.CUENTA, { method: 'DELETE', body: confirmacion });
}
