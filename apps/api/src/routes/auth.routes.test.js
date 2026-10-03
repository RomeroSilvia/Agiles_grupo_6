import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as authRepository from '../repositories/auth.repository.js';
import * as intentoLoginRepository from '../repositories/intentoLogin.repository.js';
import { ConflictError, ExternalServiceError, RateLimitError } from '../errors/index.js';
import { USUARIO } from '../test/fixtures.js';

// La base es compartida: los tests nunca llegan a Supabase
vi.mock('../repositories/auth.repository.js');
vi.mock('../repositories/intentoLogin.repository.js');

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
