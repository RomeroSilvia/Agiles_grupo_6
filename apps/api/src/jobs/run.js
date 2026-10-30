import { runJob } from './index.js';

const nombre = process.argv[2];

if (!nombre) {
  console.error('Indicá el nombre del job. Disponibles: syncAvailability, sendNotifications');
  process.exitCode = 1;
} else {
  try {
    const resultado = await runJob(nombre);
    console.info('Terminó el job ' + nombre, resultado);
    if (resultado.errores.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Falló el job ' + nombre, error);
    process.exitCode = 1;
  }
}
