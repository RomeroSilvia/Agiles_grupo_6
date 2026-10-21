import cron from 'node-cron';
import { JOBS_CONFIG } from '../config/jobs.config.js';
import { sendNotifications } from './sendNotifications.job.js';
import { syncAvailability } from './syncAvailability.job.js';

const JOBS = Object.freeze({ syncAvailability, sendNotifications });

let tasks;

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

async function ejecutarEnvioProgramado() {
  try {
    const { errores, ...totales } = await sendNotifications();
    if (totales.enviados + totales.fallidos + totales.descartados + totales.pendientes > 0) {
      console.info('Terminó el envío de avisos de disponibilidad', {
        ...totales,
        errores: errores.length,
      });
    }
  } catch (error) {
    console.error('Falló el envío de avisos de disponibilidad', error);
  }
}

function programar(nombre, expresion, tarea) {
  return cron.schedule(expresion, tarea, {
    name: nombre,
    timezone: JOBS_CONFIG.TIMEZONE,
    noOverlap: true,
    distributed: true,
  });
}

export function registerJobs() {
  tasks ??= [
    programar(
      'syncAvailability',
      JOBS_CONFIG.SYNC_AVAILABILITY_SCHEDULE,
      ejecutarSincronizacionProgramada,
    ),
    programar(
      'sendNotifications',
      JOBS_CONFIG.SEND_NOTIFICATIONS_SCHEDULE,
      ejecutarEnvioProgramado,
    ),
  ];

  return tasks;
}

export async function runJob(nombre) {
  if (!Object.hasOwn(JOBS, nombre)) {
    throw new Error('Job desconocido: ' + nombre);
  }

  return JOBS[nombre]();
}
