export const JOBS_CONFIG = Object.freeze({
  SYNC_AVAILABILITY_SCHEDULE: '0 3 * * *',
  // Cada hora: manda los avisos que generó la sincronización y reintenta los que fallaron.
  SEND_NOTIFICATIONS_SCHEDULE: '30 * * * *',
  TIMEZONE: 'America/Argentina/Buenos_Aires',
});
