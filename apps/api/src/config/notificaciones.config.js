export const NOTIFICACIONES_CONFIG = Object.freeze({
  // Después de este número de envíos fallidos el aviso queda como fallido y no se reintenta.
  MAX_INTENTOS: 3,
  // Resend limita la cantidad de solicitudes por segundo.
  ESPERA_ENTRE_ENVIOS_MS: 600,
  TAMANO_PAGINA: 1000,
});
