import { beforeEach, describe, expect, it, vi } from 'vitest';

const envMock = vi.hoisted(() => ({ env: {} }));

vi.mock('../config/env.config.js', () => envMock);
vi.mock('../config/notificaciones.config.js', () => ({
  NOTIFICACIONES_CONFIG: { MAX_INTENTOS: 3, ESPERA_ENTRE_ENVIOS_MS: 0 },
}));
vi.mock('../repositories/notificacion.repository.js', () => ({
  listarPorEnviar: vi.fn(),
  marcarEnviadas: vi.fn(),
  marcarFallidas: vi.fn(),
  eliminar: vi.fn(),
}));
vi.mock('../repositories/watchlist.repository.js', () => ({ tieneAvisoActivo: vi.fn() }));
vi.mock('../repositories/auth.repository.js', () => ({ obtenerEmail: vi.fn() }));
vi.mock('./email.service.js', () => ({ enviarAvisoDisponibilidad: vi.fn() }));

import { DatabaseError, ExternalServiceError } from '../errors/index.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as notificacionRepository from '../repositories/notificacion.repository.js';
import * as watchlistRepository from '../repositories/watchlist.repository.js';
import * as emailService from './email.service.js';
import { enviarNotificaciones } from './notificacion.service.js';

const ANA = 'b7d8e1c2-0000-4000-8000-000000000001';
const LUIS = 'b7d8e1c2-0000-4000-8000-000000000002';
const DUNE = { id: 17, tmdbId: 42, tipo: 'pelicula', nombre: 'Dune', anio: 2021 };

function aviso(id, { usuarioId = ANA, titulo = DUNE, plataforma = 'Netflix', intentos = 0 } = {}) {
  return {
    id,
    usuarioId,
    region: 'AR',
    intentos,
    titulo,
    plataforma: { id: id, nombre: plataforma },
  };
}

function errorDeResend(status) {
  const cause = new Error(`HTTP ${status}: rechazado`);
  cause.status = status;
  return new ExternalServiceError('el servicio de avisos por mail', cause);
}

beforeEach(() => {
  vi.resetAllMocks();
  envMock.env = {
    RESEND_API_KEY: 're_prueba',
    RESEND_FROM: 'Streamly <avisos@streamly.com>',
    FRONTEND_URL: 'https://streamly.app',
  };
  watchlistRepository.tieneAvisoActivo.mockResolvedValue(true);
  authRepository.obtenerEmail.mockImplementation(async (id) =>
    id === ANA ? 'ana@mail.com' : 'luis@mail.com',
  );
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('enviarNotificaciones', () => {
  it('no hace nada si no hay avisos, aunque falte la configuración de Resend', async () => {
    envMock.env = {};
    notificacionRepository.listarPorEnviar.mockResolvedValue([]);

    await expect(enviarNotificaciones()).resolves.toEqual({
      enviados: 0,
      fallidos: 0,
      descartados: 0,
      pendientes: 0,
      errores: [],
    });
    expect(notificacionRepository.listarPorEnviar).toHaveBeenCalledWith(3);
  });

  it('falla sin tocar los avisos si hay avisos y falta la configuración de Resend', async () => {
    envMock.env = { FRONTEND_URL: 'https://streamly.app' };
    notificacionRepository.listarPorEnviar.mockResolvedValue([aviso(1)]);

    await expect(enviarNotificaciones()).rejects.toThrow('RESEND_API_KEY');
    expect(emailService.enviarAvisoDisponibilidad).not.toHaveBeenCalled();
    expect(notificacionRepository.marcarFallidas).not.toHaveBeenCalled();
  });

  it('manda un mail por usuario y título con todas las plataformas y marca los avisos', async () => {
    notificacionRepository.listarPorEnviar.mockResolvedValue([
      aviso(1, { plataforma: 'Prime Video' }),
      aviso(2, { plataforma: 'Netflix' }),
      aviso(3, { usuarioId: LUIS }),
    ]);

    const resultado = await enviarNotificaciones();

    expect(resultado).toMatchObject({ enviados: 2, fallidos: 0, errores: [] });
    expect(emailService.enviarAvisoDisponibilidad).toHaveBeenCalledTimes(2);
    expect(emailService.enviarAvisoDisponibilidad).toHaveBeenCalledWith('ana@mail.com', {
      titulo: DUNE,
      plataformas: ['Netflix', 'Prime Video'],
      enlace: 'https://streamly.app/titulos/pelicula/42',
      idempotencyKey: 'aviso-disponibilidad/1-2/0',
    });
    expect(notificacionRepository.marcarEnviadas).toHaveBeenCalledWith([1, 2], expect.any(String));
    expect(notificacionRepository.marcarEnviadas).toHaveBeenCalledWith([3], expect.any(String));
  });

  it('descarta el aviso si el usuario quitó el título o ya no tiene cuenta', async () => {
    notificacionRepository.listarPorEnviar.mockResolvedValue([
      aviso(1),
      aviso(2, { usuarioId: LUIS }),
    ]);
    watchlistRepository.tieneAvisoActivo.mockImplementation(async (id) => id !== ANA);
    authRepository.obtenerEmail.mockResolvedValue(null);

    const resultado = await enviarNotificaciones();

    expect(resultado).toMatchObject({ enviados: 0, descartados: 2 });
    expect(notificacionRepository.eliminar).toHaveBeenCalledWith([1]);
    expect(notificacionRepository.eliminar).toHaveBeenCalledWith([2]);
    expect(emailService.enviarAvisoDisponibilidad).not.toHaveBeenCalled();
  });

  it('marca como fallido el aviso que no se pudo mandar y sigue con los demás', async () => {
    notificacionRepository.listarPorEnviar.mockResolvedValue([
      aviso(1, { intentos: 1 }),
      aviso(2, { usuarioId: LUIS }),
    ]);
    emailService.enviarAvisoDisponibilidad.mockRejectedValueOnce(errorDeResend(500));

    const resultado = await enviarNotificaciones();

    expect(resultado).toMatchObject({ enviados: 1, fallidos: 1 });
    expect(resultado.errores).toEqual(['Aviso 1: HTTP 500: rechazado']);
    expect(notificacionRepository.marcarFallidas).toHaveBeenCalledWith([1], {
      intentos: 2,
      error: 'HTTP 500: rechazado',
    });
    expect(emailService.enviarAvisoDisponibilidad).toHaveBeenLastCalledWith(
      'luis@mail.com',
      expect.objectContaining({ idempotencyKey: 'aviso-disponibilidad/2/0' }),
    );
    expect(notificacionRepository.marcarEnviadas).toHaveBeenCalledWith([2], expect.any(String));
  });

  it('frena sin contar intentos si Resend llegó a su límite de envíos', async () => {
    notificacionRepository.listarPorEnviar.mockResolvedValue([
      aviso(1),
      aviso(2, { usuarioId: LUIS }),
    ]);
    emailService.enviarAvisoDisponibilidad.mockRejectedValueOnce(errorDeResend(429));

    const resultado = await enviarNotificaciones();

    expect(resultado).toMatchObject({ enviados: 0, fallidos: 0, pendientes: 2 });
    expect(resultado.errores).toHaveLength(1);
    expect(emailService.enviarAvisoDisponibilidad).toHaveBeenCalledTimes(1);
    expect(notificacionRepository.marcarFallidas).not.toHaveBeenCalled();
  });

  it('corta la ejecución si falla la base', async () => {
    notificacionRepository.listarPorEnviar.mockResolvedValue([aviso(1)]);
    notificacionRepository.marcarEnviadas.mockRejectedValue(new DatabaseError(new Error('caída')));

    await expect(enviarNotificaciones()).rejects.toBeInstanceOf(DatabaseError);
    expect(notificacionRepository.marcarFallidas).not.toHaveBeenCalled();
  });
});
