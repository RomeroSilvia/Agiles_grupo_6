import * as notificacionService from '../services/notificacion.service.js';

export function sendNotifications() {
  return notificacionService.enviarNotificaciones();
}
