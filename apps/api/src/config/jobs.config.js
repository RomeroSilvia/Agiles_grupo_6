import { ZONA_HORARIA_AR } from '@buscador/shared/constants';

export const JOBS_CONFIG = Object.freeze({
  SYNC_AVAILABILITY_SCHEDULE: '0 3 * * *',
  // Cada hora: manda los avisos que generó la sincronización y reintenta los que fallaron.
  SEND_NOTIFICATIONS_SCHEDULE: '30 * * * *',
  TIMEZONE: ZONA_HORARIA_AR,
});
