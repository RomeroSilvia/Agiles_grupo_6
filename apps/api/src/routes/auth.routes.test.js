import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as intentoLoginRepository from '../repositories/intentoLogin.repository.js';
import * as emailService from '../services/email.service.js';
import { ConflictError, ExternalServiceError, RateLimitError } from '../errors/index.js';
import { RATE_LIMIT_RECUPERACION } from '../config/cuenta.config.js';
import { USUARIO } from '../test/fixtures.js';

// La base es compartida: los tests nunca llegan a Supabase
vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/intentoLogin.repository.js');
vi.mock('../services/email.service.js');

const SESION = {
  accessToken: 'access-de-prueba',
  refreshToken: 'refresh-de-prueba',
  expiresIn: 3600,
  user: USUARIO,
};
const PASSWORD_VALIDA = 'Segura#2026';

function cookiesDe(res) {
  return (res.headers['set-cookie'] ?? []).join(';');
}

beforeEach(() => {
  vi.resetAllMocks();
  intentoLoginRepository.obtenerBloqueo.mockResolvedValue(null);
  intentoLoginRepository.registrarFallido.mockResolvedValue(null);
});

describe('POST /api/auth/sign-up', () => {
  it('registra al usuario, inicia la sesión y guarda los tokens en cookies httpOnly', async () => {
    authRepository.crearUsuario.mockResolvedValue(USUARIO);
    authRepository.iniciarSesionConPassword.mockResolvedValue(SESION);

    const res = await request(createApp())
      .post('/api/auth/sign-up')
      .send({ email: USUARIO.email, password: PASSWORD_VALIDA });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { user: USUARIO } });
    expect(authRepository.crearUsuario).toHaveBeenCalledWith(USUARIO.email, PASSWORD_VALIDA);
    expect(cookiesDe(res)).toMatch(/access_token=access-de-prueba;.*HttpOnly/);
    expect(cookiesDe(res)).toMatch(/refresh_token=refresh-de-prueba;.*HttpOnly/);
  });

  it('responde 409 si el mail ya está registrado', async () => {
    authRepository.crearUsuario.mockRejectedValue(new ConflictError('Ese mail ya está registrado'));

    const res = await request(createApp())
      .post('/api/auth/sign-up')
      .send({ email: USUARIO.email, password: PASSWORD_VALIDA });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(cookiesDe(res)).toBe('');
  });

  it.each([
    ['menos de 8 caracteres', 'Ab#1'],
    ['sin mayúscula', 'segura#2026'],
    ['sin número', 'Segura#abcd'],
    ['sin carácter especial', 'Segura2026'],
  ])('rechaza con 400 una contraseña %s', async (_caso, password) => {
    const res = await request(createApp())
      .post('/api/auth/sign-up')
      .send({ email: USUARIO.email, password });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(res.body.error.details[0].field).toBe('password');
    expect(authRepository.crearUsuario).not.toHaveBeenCalled();
  });

  it('rechaza con 400 un mail inválido', async () => {
    const res = await request(createApp())
      .post('/api/auth/sign-up')
      .send({ email: 'no-es-un-mail', password: PASSWORD_VALIDA });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('email');
  });
});

describe('POST /api/auth/sign-in', () => {
  it('inicia la sesión, guarda las cookies y reinicia el contador de intentos', async () => {
    authRepository.iniciarSesionConPassword.mockResolvedValue(SESION);

    const res = await request(createApp())
      .post('/api/auth/sign-in')
      .send({ email: USUARIO.email, password: PASSWORD_VALIDA });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { user: USUARIO } });
    expect(cookiesDe(res)).toMatch(/access_token=access-de-prueba/);
    expect(intentoLoginRepository.limpiar).toHaveBeenCalledWith(USUARIO.email);
  });

  it('responde 401 con un mensaje genérico si las credenciales no coinciden', async () => {
    authRepository.iniciarSesionConPassword.mockResolvedValue(null);

    const res = await request(createApp())
      .post('/api/auth/sign-in')
      .send({ email: USUARIO.email, password: 'Incorrecta#1' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('El mail o la contraseña no son correctos');
    expect(intentoLoginRepository.registrarFallido).toHaveBeenCalledWith(USUARIO.email, 5, 15);
    expect(cookiesDe(res)).toBe('');
  });

  it('responde 429 cuando el intento fallido bloquea el mail', async () => {
    authRepository.iniciarSesionConPassword.mockResolvedValue(null);
    intentoLoginRepository.registrarFallido.mockResolvedValue(new Date(Date.now() + 15 * 60_000));

    const res = await request(createApp())
      .post('/api/auth/sign-in')
      .send({ email: USUARIO.email, password: 'Incorrecta#1' });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_ATTEMPTS');
    expect(res.body.error.message).toMatch(/15 minutos/);
  });

  it('responde 429 sin consultar a Supabase si el mail ya está bloqueado', async () => {
    intentoLoginRepository.obtenerBloqueo.mockResolvedValue(new Date(Date.now() + 60_000));

    const res = await request(createApp())
      .post('/api/auth/sign-in')
      .send({ email: USUARIO.email, password: PASSWORD_VALIDA });

    expect(res.status).toBe(429);
    expect(res.body.error.message).toMatch(/1 minuto\./);
    expect(authRepository.iniciarSesionConPassword).not.toHaveBeenCalled();
  });

  it('no cuenta como intento fallido el límite de solicitudes de Supabase', async () => {
    authRepository.iniciarSesionConPassword.mockRejectedValue(new RateLimitError());

    const res = await request(createApp())
      .post('/api/auth/sign-in')
      .send({ email: USUARIO.email, password: PASSWORD_VALIDA });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(intentoLoginRepository.registrarFallido).not.toHaveBeenCalled();
  });
});

describe('GET /api/auth/session', () => {
  it('devuelve data null si no hay sesión', async () => {
    const res = await request(createApp()).get('/api/auth/session');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: null });
  });

  it('devuelve el usuario si el access token es válido', async () => {
    authRepository.obtenerUsuarioPorToken.mockResolvedValue(USUARIO);

    const res = await request(createApp())
      .get('/api/auth/session')
      .set('Cookie', 'access_token=access-de-prueba');

    expect(res.body).toEqual({ data: { user: USUARIO } });
  });

  it('renueva las cookies con el refresh token si el access token venció', async () => {
    authRepository.obtenerUsuarioPorToken.mockResolvedValue(null);
    authRepository.refrescarSesion.mockResolvedValue({ ...SESION, accessToken: 'access-nuevo' });

    const res = await request(createApp())
      .get('/api/auth/session')
      .set('Cookie', 'access_token=vencido; refresh_token=refresh-de-prueba');

    expect(res.body).toEqual({ data: { user: USUARIO } });
    expect(cookiesDe(res)).toMatch(/access_token=access-nuevo/);
  });

  it('renueva una sola vez si llegan dos requests simultáneos con el mismo refresh token', async () => {
    // La renovación recién termina cuando el segundo request ya llegó
    let terminarRenovacion;
    authRepository.refrescarSesion.mockReturnValue(
      new Promise((resolve) => {
        terminarRenovacion = resolve;
      }),
    );
    let consultas = 0;
    authRepository.obtenerUsuarioPorToken.mockImplementation(async () => {
      consultas += 1;
      if (consultas === 2) {
        setImmediate(() => terminarRenovacion({ ...SESION, accessToken: 'access-nuevo' }));
      }
      return null;
    });
    const app = createApp();
    const pedirSesion = () =>
      request(app)
        .get('/api/auth/session')
        .set('Cookie', 'access_token=vencido; refresh_token=refresh-simultaneo');

    const [primera, segunda] = await Promise.all([pedirSesion(), pedirSesion()]);

    expect(authRepository.refrescarSesion).toHaveBeenCalledTimes(1);
    expect(primera.body).toEqual({ data: { user: USUARIO } });
    expect(segunda.body).toEqual({ data: { user: USUARIO } });
    expect(cookiesDe(segunda)).toMatch(/access_token=access-nuevo/);
  });

  it('no borra las cookies si Supabase limita las solicitudes', async () => {
    authRepository.obtenerUsuarioPorToken.mockRejectedValue(new RateLimitError());

    const res = await request(createApp())
      .get('/api/auth/session')
      .set('Cookie', 'access_token=access-de-prueba; refresh_token=refresh-de-prueba');

    expect(res.status).toBe(429);
    expect(cookiesDe(res)).toBe('');
    expect(authRepository.refrescarSesion).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/sign-out', () => {
  it('cierra la sesión y borra las cookies', async () => {
    authRepository.cerrarSesion.mockResolvedValue(true);

    const res = await request(createApp())
      .post('/api/auth/sign-out')
      .set('Cookie', 'access_token=access-de-prueba; refresh_token=refresh-de-prueba');

    expect(res.status).toBe(204);
    expect(authRepository.cerrarSesion).toHaveBeenCalledWith('access-de-prueba');
    expect(authRepository.refrescarSesion).not.toHaveBeenCalled();
    expect(cookiesDe(res)).toMatch(/access_token=;/);
    expect(cookiesDe(res)).toMatch(/refresh_token=;/);
  });

  it('renueva la sesión para revocar el refresh token si el access token venció', async () => {
    authRepository.cerrarSesion.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    authRepository.refrescarSesion.mockResolvedValue({ ...SESION, accessToken: 'access-nuevo' });

    const res = await request(createApp())
      .post('/api/auth/sign-out')
      .set('Cookie', 'access_token=vencido; refresh_token=refresh-de-prueba');

    expect(res.status).toBe(204);
    expect(authRepository.refrescarSesion).toHaveBeenCalledWith('refresh-de-prueba');
    expect(authRepository.cerrarSesion).toHaveBeenLastCalledWith('access-nuevo');
    expect(cookiesDe(res)).not.toMatch(/access_token=access-nuevo/);
  });

  it('revoca con el refresh token aunque ya no haya access token', async () => {
    authRepository.refrescarSesion.mockResolvedValue({ ...SESION, accessToken: 'access-nuevo' });
    authRepository.cerrarSesion.mockResolvedValue(true);

    const res = await request(createApp())
      .post('/api/auth/sign-out')
      .set('Cookie', 'refresh_token=refresh-de-prueba');

    expect(res.status).toBe(204);
    expect(authRepository.cerrarSesion).toHaveBeenCalledWith('access-nuevo');
  });

  it('informa el error pero igual borra las cookies si la revocación falla', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    authRepository.cerrarSesion.mockRejectedValue(new ExternalServiceError('de autenticación'));

    const res = await request(createApp())
      .post('/api/auth/sign-out')
      .set('Cookie', 'access_token=access-de-prueba; refresh_token=refresh-de-prueba');

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('EXTERNAL_SERVICE');
    expect(cookiesDe(res)).toMatch(/access_token=;/);
    expect(cookiesDe(res)).toMatch(/refresh_token=;/);
    consoleError.mockRestore();
  });
});

const COOKIES_SESION = 'access_token=access-de-prueba; refresh_token=refresh-de-prueba';
const TOKEN_ENLACE = 'token-del-enlace';

function conSesion() {
  authRepository.obtenerUsuarioPorToken.mockResolvedValue(USUARIO);
}

describe('POST /api/auth/password-recovery', () => {
  it('manda el enlace por mail si la cuenta existe', async () => {
    authRepository.generarEnlace.mockResolvedValue(TOKEN_ENLACE);
    emailService.enviarRecuperacionPassword.mockResolvedValue();

    const res = await request(createApp())
      .post('/api/auth/password-recovery')
      .send({ email: 'existe@mail.com' });

    expect(res.status).toBe(202);
    await vi.waitFor(() =>
      expect(emailService.enviarRecuperacionPassword).toHaveBeenCalledWith(
        'existe@mail.com',
        expect.stringContaining(`/restablecer-contrasena#token=${TOKEN_ENLACE}`),
      ),
    );
  });

  it('responde igual si el mail no está registrado y no manda nada', async () => {
    authRepository.generarEnlace.mockResolvedValue(null);

    const res = await request(createApp())
      .post('/api/auth/password-recovery')
      .send({ email: 'no-existe@mail.com' });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({});
    await vi.waitFor(() => expect(authRepository.generarEnlace).toHaveBeenCalled());
    expect(emailService.enviarRecuperacionPassword).not.toHaveBeenCalled();
  });

  it('no manda otro mail si se pide de nuevo enseguida', async () => {
    authRepository.generarEnlace.mockResolvedValue(TOKEN_ENLACE);
    emailService.enviarRecuperacionPassword.mockResolvedValue();
    const app = createApp();

    await request(app).post('/api/auth/password-recovery').send({ email: 'repetido@mail.com' });
    const res = await request(app)
      .post('/api/auth/password-recovery')
      .send({ email: 'Repetido@mail.com' });

    expect(res.status).toBe(202);
    await vi.waitFor(() => expect(emailService.enviarRecuperacionPassword).toHaveBeenCalled());
    expect(emailService.enviarRecuperacionPassword).toHaveBeenCalledTimes(1);
  });

  it('rechaza con 400 un mail inválido', async () => {
    const res = await request(createApp())
      .post('/api/auth/password-recovery')
      .send({ email: 'no-es-un-mail' });

    expect(res.status).toBe(400);
    expect(authRepository.generarEnlace).not.toHaveBeenCalled();
  });

  it('responde 429 si desde la misma IP se piden demasiados enlaces', async () => {
    authRepository.generarEnlace.mockResolvedValue(null);
    const app = createApp();

    let res;
    for (let i = 0; i <= RATE_LIMIT_RECUPERACION.maxRequests; i++) {
      res = await request(app)
        .post('/api/auth/password-recovery')
        .send({ email: `persona${i}@mail.com` });
    }

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('POST /api/auth/password-reset', () => {
  it('guarda la contraseña nueva y cierra todas las sesiones', async () => {
    authRepository.verificarEnlace.mockResolvedValue({
      user: USUARIO,
      appMetadata: {},
      sesion: SESION,
    });
    authRepository.cerrarSesion.mockResolvedValue(true);

    const res = await request(createApp())
      .post('/api/auth/password-reset')
      .send({ token: TOKEN_ENLACE, password: PASSWORD_VALIDA });

    expect(res.status).toBe(204);
    expect(authRepository.actualizarUsuario).toHaveBeenCalledWith(USUARIO.id, {
      password: PASSWORD_VALIDA,
    });
    expect(authRepository.cerrarSesion).toHaveBeenCalledWith(SESION.accessToken, 'global');
    expect(intentoLoginRepository.limpiar).toHaveBeenCalledWith(USUARIO.email);
    expect(cookiesDe(res)).toMatch(/access_token=;/);
    expect(cookiesDe(res)).toMatch(/refresh_token=;/);
  });

  it('responde 400 INVALID_LINK si el enlace venció o ya se usó', async () => {
    authRepository.verificarEnlace.mockResolvedValue(null);

    const res = await request(createApp())
      .post('/api/auth/password-reset')
      .send({ token: TOKEN_ENLACE, password: PASSWORD_VALIDA });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_LINK');
    expect(authRepository.actualizarUsuario).not.toHaveBeenCalled();
    expect(cookiesDe(res)).toBe('');
  });

  it('rechaza una contraseña que no cumple los requisitos', async () => {
    const res = await request(createApp())
      .post('/api/auth/password-reset')
      .send({ token: TOKEN_ENLACE, password: 'debil' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(authRepository.verificarEnlace).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/password-change', () => {
  const PASSWORD_NUEVA = 'Nueva#2026';

  it('cambia la contraseña, cierra las otras sesiones y deja una sesión nueva', async () => {
    conSesion();
    authRepository.iniciarSesionConPassword
      .mockResolvedValueOnce(SESION)
      .mockResolvedValueOnce({ ...SESION, accessToken: 'access-nuevo' });
    authRepository.cerrarSesion.mockResolvedValue(true);

    const res = await request(createApp())
      .post('/api/auth/password-change')
      .set('Cookie', COOKIES_SESION)
      .send({ currentPassword: PASSWORD_VALIDA, newPassword: PASSWORD_NUEVA });

    expect(res.status).toBe(204);
    expect(authRepository.actualizarUsuario).toHaveBeenCalledWith(USUARIO.id, {
      password: PASSWORD_NUEVA,
    });
    expect(authRepository.cerrarSesion).toHaveBeenCalledWith('access-de-prueba', 'global');
    expect(cookiesDe(res)).toMatch(/access_token=access-nuevo/);
  });

  it('cierra las otras sesiones con los tokens renovados si el access token venció', async () => {
    authRepository.obtenerUsuarioPorToken.mockResolvedValue(null);
    authRepository.refrescarSesion.mockResolvedValue({ ...SESION, accessToken: 'access-renovado' });
    authRepository.iniciarSesionConPassword.mockResolvedValue(SESION);
    authRepository.cerrarSesion.mockResolvedValue(true);

    const res = await request(createApp())
      .post('/api/auth/password-change')
      .set('Cookie', 'access_token=vencido; refresh_token=refresh-de-prueba')
      .send({ currentPassword: PASSWORD_VALIDA, newPassword: PASSWORD_NUEVA });

    expect(res.status).toBe(204);
    expect(authRepository.cerrarSesion).toHaveBeenCalledWith('access-renovado', 'global');
    expect(authRepository.cerrarSesion).not.toHaveBeenCalledWith('vencido', 'global');
  });

  it('responde 403 si la contraseña actual no es correcta y no la cambia', async () => {
    conSesion();
    authRepository.iniciarSesionConPassword.mockResolvedValue(null);

    const res = await request(createApp())
      .post('/api/auth/password-change')
      .set('Cookie', COOKIES_SESION)
      .send({ currentPassword: 'Incorrecta#1', newPassword: PASSWORD_NUEVA });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(intentoLoginRepository.registrarFallido).toHaveBeenCalled();
    expect(authRepository.actualizarUsuario).not.toHaveBeenCalled();
  });

  it('rechaza una contraseña nueva igual a la actual', async () => {
    conSesion();

    const res = await request(createApp())
      .post('/api/auth/password-change')
      .set('Cookie', COOKIES_SESION)
      .send({ currentPassword: PASSWORD_VALIDA, newPassword: PASSWORD_VALIDA });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('newPassword');
  });

  it('responde 401 sin sesión', async () => {
    const res = await request(createApp())
      .post('/api/auth/password-change')
      .send({ currentPassword: PASSWORD_VALIDA, newPassword: PASSWORD_NUEVA });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/email-change', () => {
  const NUEVO_EMAIL = 'nuevo@mail.com';

  it('verifica la contraseña y manda el enlace al mail nuevo', async () => {
    conSesion();
    authRepository.iniciarSesionConPassword.mockResolvedValue(SESION);
    authRepository.generarEnlace.mockResolvedValue(TOKEN_ENLACE);

    const res = await request(createApp())
      .post('/api/auth/email-change')
      .set('Cookie', COOKIES_SESION)
      .send({ email: NUEVO_EMAIL, password: PASSWORD_VALIDA });

    expect(res.status).toBe(202);
    expect(authRepository.actualizarUsuario).toHaveBeenCalledWith(USUARIO.id, {
      appMetadata: { mail_anterior: USUARIO.email },
    });
    expect(emailService.enviarConfirmacionCambioMail).toHaveBeenCalledWith(
      NUEVO_EMAIL,
      expect.stringContaining(`/confirmar-mail#token=${TOKEN_ENLACE}`),
    );
  });

  it('responde 409 si el mail ya está en uso y no manda nada', async () => {
    conSesion();
    authRepository.iniciarSesionConPassword.mockResolvedValue(SESION);
    authRepository.generarEnlace.mockRejectedValue(new ConflictError('No podés usar ese mail'));

    const res = await request(createApp())
      .post('/api/auth/email-change')
      .set('Cookie', COOKIES_SESION)
      .send({ email: NUEVO_EMAIL, password: PASSWORD_VALIDA });

    expect(res.status).toBe(409);
    expect(emailService.enviarConfirmacionCambioMail).not.toHaveBeenCalled();
  });

  it('no revela si el mail está en uso cuando la contraseña es incorrecta', async () => {
    conSesion();
    authRepository.iniciarSesionConPassword.mockResolvedValue(null);

    const res = await request(createApp())
      .post('/api/auth/email-change')
      .set('Cookie', COOKIES_SESION)
      .send({ email: NUEVO_EMAIL, password: 'Incorrecta#1' });

    expect(res.status).toBe(403);
    expect(authRepository.generarEnlace).not.toHaveBeenCalled();
  });

  it('rechaza el mail actual', async () => {
    conSesion();

    const res = await request(createApp())
      .post('/api/auth/email-change')
      .set('Cookie', COOKIES_SESION)
      .send({ email: USUARIO.email, password: PASSWORD_VALIDA });

    expect(res.status).toBe(409);
    expect(authRepository.iniciarSesionConPassword).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/email-change/confirm', () => {
  const NUEVO = { ...USUARIO, email: 'nuevo@mail.com' };

  it('confirma el cambio y avisa al mail anterior', async () => {
    authRepository.verificarEnlace.mockResolvedValue({
      user: NUEVO,
      appMetadata: { mail_anterior: USUARIO.email },
      sesion: null,
    });
    emailService.enviarAvisoCambioMail.mockResolvedValue();

    const res = await request(createApp())
      .post('/api/auth/email-change/confirm')
      .send({ token: TOKEN_ENLACE });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { email: NUEVO.email } });
    expect(emailService.enviarAvisoCambioMail).toHaveBeenCalledWith(USUARIO.email, NUEVO.email);
    expect(authRepository.actualizarUsuario).toHaveBeenCalledWith(USUARIO.id, {
      appMetadata: { mail_anterior: null },
    });
  });

  it('renueva las cookies si la sesión abierta es del mismo usuario', async () => {
    conSesion();
    authRepository.verificarEnlace.mockResolvedValue({
      user: NUEVO,
      appMetadata: {},
      sesion: { ...SESION, accessToken: 'access-con-mail-nuevo', user: NUEVO },
    });

    const res = await request(createApp())
      .post('/api/auth/email-change/confirm')
      .set('Cookie', COOKIES_SESION)
      .send({ token: TOKEN_ENLACE });

    expect(res.status).toBe(200);
    expect(cookiesDe(res)).toMatch(/access_token=access-con-mail-nuevo/);
    expect(authRepository.cerrarSesion).not.toHaveBeenCalled();
  });

  it('revoca la sesión del enlace si se abre sin la sesión del mismo usuario', async () => {
    authRepository.verificarEnlace.mockResolvedValue({
      user: NUEVO,
      appMetadata: {},
      sesion: { ...SESION, accessToken: 'access-del-enlace', user: NUEVO },
    });
    authRepository.cerrarSesion.mockResolvedValue(true);

    const res = await request(createApp())
      .post('/api/auth/email-change/confirm')
      .send({ token: TOKEN_ENLACE });

    expect(res.status).toBe(200);
    expect(authRepository.cerrarSesion).toHaveBeenCalledWith('access-del-enlace');
    expect(cookiesDe(res)).toBe('');
  });

  it('responde 400 INVALID_LINK si el enlace venció o ya se usó', async () => {
    authRepository.verificarEnlace.mockResolvedValue(null);

    const res = await request(createApp())
      .post('/api/auth/email-change/confirm')
      .send({ token: TOKEN_ENLACE });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_LINK');
  });
});

describe('DELETE /api/auth/account', () => {
  it('con ELIMINAR cierra todas las sesiones, borra la cuenta y las cookies', async () => {
    conSesion();
    authRepository.cerrarSesion.mockResolvedValue(true);

    const res = await request(createApp())
      .delete('/api/auth/account')
      .set('Cookie', COOKIES_SESION)
      .send({ confirmation: 'ELIMINAR' });

    expect(res.status).toBe(204);
    expect(authRepository.cerrarSesion).toHaveBeenCalledWith('access-de-prueba', 'global');
    expect(authRepository.eliminarUsuario).toHaveBeenCalledWith(USUARIO.id);
    expect(intentoLoginRepository.limpiar).toHaveBeenCalledWith(USUARIO.email);
    expect(cookiesDe(res)).toMatch(/access_token=;/);
    expect(cookiesDe(res)).toMatch(/refresh_token=;/);
  });

  it('con la contraseña correcta también borra la cuenta', async () => {
    conSesion();
    authRepository.iniciarSesionConPassword.mockResolvedValue(SESION);
    authRepository.cerrarSesion.mockResolvedValue(true);

    const res = await request(createApp())
      .delete('/api/auth/account')
      .set('Cookie', COOKIES_SESION)
      .send({ password: PASSWORD_VALIDA });

    expect(res.status).toBe(204);
    expect(authRepository.eliminarUsuario).toHaveBeenCalledWith(USUARIO.id);
  });

  it('no borra nada si la contraseña es incorrecta', async () => {
    conSesion();
    authRepository.iniciarSesionConPassword.mockResolvedValue(null);

    const res = await request(createApp())
      .delete('/api/auth/account')
      .set('Cookie', COOKIES_SESION)
      .send({ password: 'Incorrecta#1' });

    expect(res.status).toBe(403);
    expect(authRepository.eliminarUsuario).not.toHaveBeenCalled();
    expect(cookiesDe(res)).toBe('');
  });

  it('rechaza otro texto de confirmación', async () => {
    conSesion();

    const res = await request(createApp())
      .delete('/api/auth/account')
      .set('Cookie', COOKIES_SESION)
      .send({ confirmation: 'eliminar' });

    expect(res.status).toBe(400);
    expect(authRepository.eliminarUsuario).not.toHaveBeenCalled();
  });

  it('responde 401 sin sesión', async () => {
    const res = await request(createApp())
      .delete('/api/auth/account')
      .send({ confirmation: 'ELIMINAR' });

    expect(res.status).toBe(401);
    expect(authRepository.eliminarUsuario).not.toHaveBeenCalled();
  });
});
