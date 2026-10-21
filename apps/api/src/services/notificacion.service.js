import { setTimeout as esperar } from 'node:timers/promises';
import { RUTAS_ENLACE_MAIL } from '@buscador/shared/constants';
import { env } from '../config/env.config.js';
import { NOTIFICACIONES_CONFIG } from '../config/notificaciones.config.js';
import { ExternalServiceError } from '../errors/index.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as notificacionRepository from '../repositories/notificacion.repository.js';
import * as watchlistRepository from '../repositories/watchlist.repository.js';
import * as emailService from './email.service.js';

const HTTP_DEMASIADAS_SOLICITUDES = 429;
const LARGO_MAXIMO_ERROR = 1000;

// La sincronización deja un aviso por plataforma; el usuario recibe un solo mail por título
// con todas las plataformas donde llegó.
function agruparPorMail(notificaciones) {
  const grupos = new Map();

  for (const notificacion of notificaciones) {
    const clave = `${notificacion.usuarioId}:${notificacion.titulo.id}:${notificacion.region}`;
    const grupo = grupos.get(clave) ?? {
      usuarioId: notificacion.usuarioId,
      titulo: notificacion.titulo,
      ids: [],
      plataformas: new Set(),
      intentos: 0,
    };
    grupo.ids.push(notificacion.id);
    grupo.plataformas.add(notificacion.plataforma.nombre);
    grupo.intentos = Math.max(grupo.intentos, notificacion.intentos);
    grupos.set(clave, grupo);
  }

  return [...grupos.values()].map((grupo) => ({
    ...grupo,
    plataformas: [...grupo.plataformas].sort((a, b) => a.localeCompare(b, 'es')),
  }));
}

function crearEnlaceDetalle({ tipo, tmdbId }) {
  const ruta = RUTAS_ENLACE_MAIL.DETALLE_TITULO.replace(':tipo', encodeURIComponent(tipo)).replace(
    ':tmdbId',
    encodeURIComponent(tmdbId),
  );
  return new URL(ruta, env.FRONTEND_URL).toString();
}

function detalleError(error) {
  const mensaje = error.cause instanceof Error ? error.cause.message : error.message;
  return mensaje.slice(0, LARGO_MAXIMO_ERROR);
}

export async function enviarNotificaciones() {
  const notificaciones = await notificacionRepository.listarPorEnviar(
    NOTIFICACIONES_CONFIG.MAX_INTENTOS,
  );
  const resultado = { enviados: 0, fallidos: 0, descartados: 0, pendientes: 0, errores: [] };

  if (notificaciones.length === 0) {
    return resultado;
  }

  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    throw new Error('Falta configurar RESEND_API_KEY o RESEND_FROM');
  }

  const grupos = agruparPorMail(notificaciones);

  for (const [indice, grupo] of grupos.entries()) {
    if (indice > 0) {
      await esperar(NOTIFICACIONES_CONFIG.ESPERA_ENTRE_ENVIOS_MS);
    }

    // Entre que se generó el aviso y ahora el usuario pudo quitar el título o borrar su cuenta.
    const avisoActivo = await watchlistRepository.tieneAvisoActivo(
      grupo.usuarioId,
      grupo.titulo.id,
    );
    const email = avisoActivo ? await authRepository.obtenerEmail(grupo.usuarioId) : null;

    if (!email) {
      await notificacionRepository.eliminar(grupo.ids);
      resultado.descartados += 1;
      continue;
    }

    try {
      await emailService.enviarAvisoDisponibilidad(email, {
        titulo: grupo.titulo,
        plataformas: grupo.plataformas,
        enlace: crearEnlaceDetalle(grupo.titulo),
        // Cambia con cada intento: si un envío falló, el reintento no reusa la clave anterior.
        idempotencyKey: `aviso-disponibilidad/${grupo.ids.join('-')}/${grupo.intentos}`,
      });
    } catch (error) {
      if (!(error instanceof ExternalServiceError)) {
        throw error;
      }

      // Límite de envíos de Resend: los que faltan quedan para la próxima ejecución sin
      // contar como intento.
      if (error.cause?.status === HTTP_DEMASIADAS_SOLICITUDES) {
        resultado.pendientes = grupos.length - indice;
        resultado.errores.push(
          `Límite de envíos de Resend: quedan ${resultado.pendientes} mails pendientes.`,
        );
        break;
      }

      const detalle = detalleError(error);
      await notificacionRepository.marcarFallidas(grupo.ids, {
        intentos: grupo.intentos + 1,
        error: detalle,
      });
      resultado.fallidos += 1;
      resultado.errores.push(`Aviso ${grupo.ids.join(', ')}: ${detalle}`);
      console.warn('Falló el envío de un aviso de disponibilidad', {
        notificaciones: grupo.ids,
        error: detalle,
      });
      continue;
    }

    await notificacionRepository.marcarEnviadas(grupo.ids, new Date().toISOString());
    resultado.enviados += 1;
  }

  return resultado;
}
