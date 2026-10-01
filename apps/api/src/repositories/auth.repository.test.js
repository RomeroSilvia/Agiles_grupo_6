import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthApiError } from '@supabase/supabase-js';
import { supabaseAdmin, createAuthClient } from '../config/supabase.config.js';
import { ExternalServiceError, RateLimitError } from '../errors/index.js';
import * as authRepository from './auth.repository.js';

vi.mock('../config/supabase.config.js', () => {
  const authClient = { auth: { signInWithPassword: vi.fn(), refreshSession: vi.fn() } };
  return {
    supabaseAdmin: { auth: { getUser: vi.fn(), admin: { signOut: vi.fn() } } },
    createAuthClient: () => authClient,
  };
});

const authClient = createAuthClient().auth;

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

describe('obtenerUsuarioPorToken y refrescarSesion', () => {
  it('devuelven null si el token venció o no es válido', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue(
      fallo(new AuthApiError('invalid JWT: token is expired', 403, 'bad_jwt')),
    );
    authClient.refreshSession.mockResolvedValue(
      fallo(new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found')),
    );

    await expect(authRepository.obtenerUsuarioPorToken('vencido')).resolves.toBeNull();
    await expect(authRepository.refrescarSesion('revocado')).resolves.toBeNull();
  });

  it('lanzan RateLimitError en lugar de tratar la sesión como inválida', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue(fallo(LIMITE));
    authClient.refreshSession.mockResolvedValue(fallo(LIMITE));

    await expect(authRepository.obtenerUsuarioPorToken('token')).rejects.toBeInstanceOf(
      RateLimitError,
    );
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
