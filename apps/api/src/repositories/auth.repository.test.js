import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthApiError, AuthSessionMissingError } from '@supabase/supabase-js';
import { base64url as codificar, errors } from 'jose';
import { supabaseAdmin, createAuthClient } from '../config/supabase.config.js';
import { supabaseJwks } from '../config/jwt.config.js';
import { ConflictError, ExternalServiceError, RateLimitError } from '../errors/index.js';
import * as authRepository from './auth.repository.js';

vi.mock('../config/supabase.config.js', () => {
  const authClient = {
    auth: { signInWithPassword: vi.fn(), refreshSession: vi.fn(), verifyOtp: vi.fn() },
  };
  return {
    supabaseAdmin: {
      auth: {
        getUser: vi.fn(),
        admin: { signOut: vi.fn(), generateLink: vi.fn(), getUserById: vi.fn() },
      },
    },
    createAuthClient: () => authClient,
  };
});

vi.mock('../config/jwt.config.js', async (importOriginal) => ({
  ...(await importOriginal()),
  supabaseJwks: vi.fn(),
}));

const authClient = createAuthClient().auth;

const base64url = (objeto) => codificar.encode(JSON.stringify(objeto));

const LIMITE = new AuthApiError('Request rate limit reached', 429, 'over_request_rate_limit');
const CAIDO = new AuthApiError('Internal error', 500, 'unexpected_failure');

function fallo(error) {
  return { data: { user: null, session: null }, error };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('iniciarSesionConPassword', () => {
  it('devuelve null solo si las credenciales no coinciden', async () => {
    authClient.signInWithPassword.mockResolvedValue(
      fallo(new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')),
    );

    await expect(authRepository.iniciarSesionConPassword('a@mail.com', 'x')).resolves.toBeNull();
  });

  it('lanza RateLimitError si Supabase limita las solicitudes', async () => {
    authClient.signInWithPassword.mockResolvedValue(fallo(LIMITE));

    await expect(authRepository.iniciarSesionConPassword('a@mail.com', 'x')).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it('lanza ExternalServiceError ante otros errores 4xx', async () => {
    authClient.signInWithPassword.mockResolvedValue(
      fallo(new AuthApiError('Unprocessable', 422, 'validation_failed')),
    );

    await expect(authRepository.iniciarSesionConPassword('a@mail.com', 'x')).rejects.toBeInstanceOf(
      ExternalServiceError,
    );
  });
});

describe('obtenerUsuarioPorToken', () => {
  // Header y payload válidos con una firma cualquiera: alcanza para que jose pida la clave.
  const TOKEN = [{ alg: 'ES256', kid: 'k1' }, { sub: 'u1' }, 'firma']
    .map((parte) => (typeof parte === 'string' ? parte : base64url(parte)))
    .join('.');

  it('no consulta a Supabase Auth: verifica el token localmente', async () => {
    supabaseJwks.mockRejectedValue(new errors.JWKSNoMatchingKey());

    await expect(authRepository.obtenerUsuarioPorToken(TOKEN)).resolves.toBeNull();
    expect(supabaseJwks).toHaveBeenCalledOnce();
    expect(supabaseAdmin.auth.getUser).not.toHaveBeenCalled();
  });

  it('lanza ExternalServiceError si no puede obtener las claves públicas', async () => {
    supabaseJwks.mockRejectedValue(new errors.JWKSTimeout());

    await expect(authRepository.obtenerUsuarioPorToken(TOKEN)).rejects.toBeInstanceOf(
      ExternalServiceError,
    );
  });
});

describe('refrescarSesion', () => {
  it('devuelve null si el refresh token no es válido', async () => {
    authClient.refreshSession.mockResolvedValue(
      fallo(new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found')),
    );

    await expect(authRepository.refrescarSesion('revocado')).resolves.toBeNull();
  });

  it('lanza RateLimitError en lugar de tratar la sesión como inválida', async () => {
    authClient.refreshSession.mockResolvedValue(fallo(LIMITE));

    await expect(authRepository.refrescarSesion('refresh')).rejects.toBeInstanceOf(RateLimitError);
  });
});

describe('cerrarSesion', () => {
  it('devuelve true si revocó la sesión', async () => {
    supabaseAdmin.auth.admin.signOut.mockResolvedValue({ data: null, error: null });

    await expect(authRepository.cerrarSesion('token')).resolves.toBe(true);
  });

  it('devuelve false si el access token venció', async () => {
    supabaseAdmin.auth.admin.signOut.mockResolvedValue(
      fallo(new AuthApiError('invalid JWT: token is expired', 403, 'bad_jwt')),
    );

    await expect(authRepository.cerrarSesion('vencido')).resolves.toBe(false);
  });

  it('devuelve false si la sesión ya no existe en Supabase', async () => {
    supabaseAdmin.auth.admin.signOut.mockResolvedValue(fallo(new AuthSessionMissingError()));

    await expect(authRepository.cerrarSesion('revocado')).resolves.toBe(false);
  });

  it('lanza el error si Supabase falla', async () => {
    supabaseAdmin.auth.admin.signOut.mockResolvedValue(fallo(CAIDO));

    await expect(authRepository.cerrarSesion('token')).rejects.toBeInstanceOf(ExternalServiceError);
  });

  it('revoca todas las sesiones con el alcance global', async () => {
    supabaseAdmin.auth.admin.signOut.mockResolvedValue({ data: null, error: null });

    await authRepository.cerrarSesion('token', authRepository.ALCANCE_SESION.GLOBAL);

    expect(supabaseAdmin.auth.admin.signOut).toHaveBeenCalledWith('token', 'global');
  });
});

describe('generarEnlace', () => {
  const { RECUPERACION, CAMBIO_MAIL } = authRepository.TIPO_ENLACE;

  it('devuelve el token sin mandar mails', async () => {
    supabaseAdmin.auth.admin.generateLink.mockResolvedValue({
      data: { properties: { hashed_token: 'hash' }, user: {} },
      error: null,
    });

    await expect(authRepository.generarEnlace(RECUPERACION, { email: 'a@mail.com' })).resolves.toBe(
      'hash',
    );
    expect(supabaseAdmin.auth.admin.generateLink).toHaveBeenCalledWith({
      type: 'recovery',
      email: 'a@mail.com',
    });
  });

  it('devuelve null si no hay una cuenta con ese mail', async () => {
    supabaseAdmin.auth.admin.generateLink.mockResolvedValue(
      fallo(new AuthApiError('User not found', 404, 'user_not_found')),
    );

    await expect(
      authRepository.generarEnlace(RECUPERACION, { email: 'nadie@mail.com' }),
    ).resolves.toBeNull();
  });

  it('lanza ConflictError si el mail nuevo ya está en uso', async () => {
    supabaseAdmin.auth.admin.generateLink.mockResolvedValue(
      fallo(new AuthApiError('Email exists', 422, 'email_exists')),
    );

    await expect(
      authRepository.generarEnlace(CAMBIO_MAIL, { email: 'a@mail.com', nuevoEmail: 'b@mail.com' }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(supabaseAdmin.auth.admin.generateLink).toHaveBeenCalledWith({
      type: 'email_change_new',
      email: 'a@mail.com',
      newEmail: 'b@mail.com',
    });
  });
});

describe('obtenerEmail', () => {
  it('devuelve el mail del usuario', async () => {
    supabaseAdmin.auth.admin.getUserById.mockResolvedValue({
      data: { user: { id: 'u1', email: 'ana@mail.com' } },
      error: null,
    });

    await expect(authRepository.obtenerEmail('u1')).resolves.toBe('ana@mail.com');
    expect(supabaseAdmin.auth.admin.getUserById).toHaveBeenCalledWith('u1');
  });

  it('devuelve null si el usuario ya no existe', async () => {
    supabaseAdmin.auth.admin.getUserById.mockResolvedValue(
      fallo(new AuthApiError('User not found', 404, 'user_not_found')),
    );

    await expect(authRepository.obtenerEmail('u1')).resolves.toBeNull();
  });

  it('lanza ExternalServiceError si Supabase Auth falla', async () => {
    supabaseAdmin.auth.admin.getUserById.mockResolvedValue(fallo(CAIDO));

    await expect(authRepository.obtenerEmail('u1')).rejects.toBeInstanceOf(ExternalServiceError);
  });
});

describe('verificarEnlace', () => {
  it('devuelve null si el enlace venció o ya se usó', async () => {
    authClient.verifyOtp.mockResolvedValue(
      fallo(new AuthApiError('Token has expired or is invalid', 403, 'otp_expired')),
    );

    await expect(
      authRepository.verificarEnlace(authRepository.TIPO_ENLACE.RECUPERACION, 'hash'),
    ).resolves.toBeNull();
  });

  it('lanza ExternalServiceError si Supabase falla', async () => {
    authClient.verifyOtp.mockResolvedValue(fallo(CAIDO));

    await expect(
      authRepository.verificarEnlace(authRepository.TIPO_ENLACE.CAMBIO_MAIL, 'hash'),
    ).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
