import cron from 'node-cron';
import { JOBS_CONFIG } from '../config/jobs.config.js';
import { syncAvailability } from './syncAvailability.job.js';

let syncAvailabilityTask;

async function ejecutarSincronizacionProgramada() {
  try {
    const resultado = await syncAvailability();
    console.info('Terminó la sincronización diaria de disponibilidad', {
      sincronizacionId: resultado.sincronizacionId,
      combinacionesProcesadas: resultado.combinacionesProcesadas,
      combinacionesPendientes: resultado.combinacionesPendientes,
      errores: resultado.errores.length,
    });
  } catch (error) {
    console.error('Falló la sincronización diaria de disponibilidad', error);
  }
}

export function registerJobs() {
  if (syncAvailabilityTask) {
    return syncAvailabilityTask;
  }

  syncAvailabilityTask = cron.schedule(
    JOBS_CONFIG.SYNC_AVAILABILITY_SCHEDULE,
    ejecutarSincronizacionProgramada,
    {
      name: 'syncAvailability',
      timezone: JOBS_CONFIG.TIMEZONE,
      noOverlap: true,
      distributed: true,
    },
  );

  return syncAvailabilityTask;
}

export async function runJob(nombre) {
  if (nombre !== 'syncAvailability') {
    throw new Error('Job desconocido: ' + nombre);
  }

  return syncAvailability();
}
