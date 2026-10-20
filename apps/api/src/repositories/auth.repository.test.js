import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthApiError } from '@supabase/supabase-js';
import { base64url as codificar, errors } from 'jose';
import { supabaseAdmin, createAuthClient } from '../config/supabase.config.js';
import { supabaseJwks } from '../config/jwt.config.js';
import { ExternalServiceError, RateLimitError } from '../errors/index.js';
import * as authRepository from './auth.repository.js';

vi.mock('../config/supabase.config.js', () => {
  const authClient = { auth: { signInWithPassword: vi.fn(), refreshSession: vi.fn() } };
  return {
    supabaseAdmin: { auth: { getUser: vi.fn(), admin: { signOut: vi.fn() } } },
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

  it('lanza el error si Supabase falla', async () => {
    supabaseAdmin.auth.admin.signOut.mockResolvedValue(fallo(CAIDO));

    await expect(authRepository.cerrarSesion('token')).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
