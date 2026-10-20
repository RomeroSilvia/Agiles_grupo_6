import { RUTAS_ENLACE_MAIL } from '@buscador/shared/constants';
import * as authRepository from '../repositories/auth.repository.js';
import * as intentoLoginRepository from '../repositories/intentoLogin.repository.js';
import * as authService from './auth.service.js';
import * as emailService from './email.service.js';
import { COOLDOWN_RECUPERACION, crearEnlace } from '../config/cuenta.config.js';
import { ConflictError, InvalidLinkError, UnauthenticatedError } from '../errors/index.js';
import { createTtlCache } from '../utils/ttlCache.js';

const { TIPO_ENLACE } = authRepository;

const recuperacionesRecientes = createTtlCache({
  ttlMs: COOLDOWN_RECUPERACION.TTL_MS,
  maxEntries: COOLDOWN_RECUPERACION.MAX_ENTRADAS,
});

export function solicitarRecuperacion({ email }) {
  return recuperacionesRecientes
    .getOrSet(email.toLowerCase(), () => enviarRecuperacion(email))
    .catch((error) => console.error(error));
}

async function enviarRecuperacion(email) {
  const token = await authRepository.generarEnlace(TIPO_ENLACE.RECUPERACION, { email });
  if (token) {
    await emailService.enviarRecuperacionPassword(
      email,
      crearEnlace(RUTAS_ENLACE_MAIL.RESTABLECER_PASSWORD, token),
    );
  }
}

export async function restablecerPassword({ token, password }) {
  const { user, sesion } = await verificarEnlace(TIPO_ENLACE.RECUPERACION, token);

  await authRepository.actualizarUsuario(user.id, { password });
  if (sesion) {
    await authService.cerrarTodasLasSesiones(sesion);
  }
  await intentoLoginRepository.limpiar(user.email);
}

export async function cambiarPassword(usuario, { currentPassword, newPassword }, tokens) {
  await authService.verificarIdentidad({ email: usuario.email, password: currentPassword });
  await authRepository.actualizarUsuario(usuario.id, { password: newPassword });
  await authService.cerrarTodasLasSesiones(tokens);
  return authService.iniciarSesion({ email: usuario.email, password: newPassword });
}

export async function solicitarCambioMail(usuario, { email: nuevoEmail, password }) {
  if (nuevoEmail.toLowerCase() === usuario.email.toLowerCase()) {
    throw new ConflictError('Ese ya es tu mail actual.');
  }

  await authService.verificarIdentidad({ email: usuario.email, password });

  const token = await authRepository.generarEnlace(TIPO_ENLACE.CAMBIO_MAIL, {
    email: usuario.email,
    nuevoEmail,
  });
  if (!token) {
    throw new UnauthenticatedError();
  }

  await authRepository.actualizarUsuario(usuario.id, {
    appMetadata: { mail_anterior: usuario.email },
  });
  await emailService.enviarConfirmacionCambioMail(
    nuevoEmail,
    crearEnlace(RUTAS_ENLACE_MAIL.CONFIRMAR_MAIL, token),
  );
}

export async function confirmarCambioMail({ token }) {
  const { user, appMetadata, sesion } = await verificarEnlace(TIPO_ENLACE.CAMBIO_MAIL, token);

  const emailAnterior = appMetadata.mail_anterior;
  if (emailAnterior) {
    await emailService
      .enviarAvisoCambioMail(emailAnterior, user.email)
      .catch((error) => console.error(error));
    await authRepository.actualizarUsuario(user.id, { appMetadata: { mail_anterior: null } });
  }

  return { user, sesion };
}

export async function eliminarCuenta(usuario, { password }, tokens) {
  if (password) {
    await authService.verificarIdentidad({ email: usuario.email, password });
  }
  await authService.cerrarTodasLasSesiones(tokens);
  await authRepository.eliminarUsuario(usuario.id);
}

async function verificarEnlace(tipo, token) {
  const resultado = await authRepository.verificarEnlace(tipo, token);
  if (!resultado) {
    throw new InvalidLinkError();
  }
  return resultado;
}
