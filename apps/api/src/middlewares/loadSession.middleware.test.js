import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { SignJWT, createLocalJWKSet, errors, exportJWK, generateKeyPair } from 'jose';
import { supabaseAdmin, createAuthClient } from '../config/supabase.config.js';
import { JWT_CONFIG } from '../config/jwt.config.js';
import { ExternalServiceError, UnauthenticatedError } from '../errors/index.js';
import { USUARIO } from '../test/fixtures.js';
import { loadSession } from './loadSession.middleware.js';
import { requireSession } from './requireSession.middleware.js';

// Las claves del proyecto se reemplazan por un par generado en el test:
// así se firman tokens reales sin descargar nada de Supabase.
const jwks = vi.hoisted(() => ({ verificar: null }));

vi.mock('../config/jwt.config.js', async (importOriginal) => ({
  ...(await importOriginal()),
  supabaseJwks: (...args) => jwks.verificar(...args),
}));

vi.mock('../config/supabase.config.js', () => {
  const authClient = { auth: { refreshSession: vi.fn() } };
  return {
    supabaseAdmin: { auth: { getUser: vi.fn() }, from: vi.fn() },
    createAuthClient: () => authClient,
  };
});

const KID = 'clave-de-prueba';
let clavePrivada;
let otraClavePrivada;

beforeAll(async () => {
  const par = await generateKeyPair('ES256');
  clavePrivada = par.privateKey;
  otraClavePrivada = (await generateKeyPair('ES256')).privateKey;
  const jwk = { ...(await exportJWK(par.publicKey)), kid: KID, alg: 'ES256' };
  jwks.verificar = createLocalJWKSet({ keys: [jwk] });
});

function firmarToken({
  clave = clavePrivada,
  vence = '1h',
  issuer = JWT_CONFIG.ISSUER,
  audience = JWT_CONFIG.AUDIENCE,
} = {}) {
  return new SignJWT({ email: USUARIO.email, role: 'authenticated' })
    .setProtectedHeader({ alg: 'ES256', kid: KID, typ: 'JWT' })
    .setSubject(USUARIO.id)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(vence)
    .sign(clave);
}

const haceUnMinuto = () => Math.floor(Date.now() / 1000) - 60;

function request(cookies) {
  return { cookies };
}

function response() {
  return { cookie: vi.fn(), clearCookie: vi.fn() };
}

const refreshSession = createAuthClient().auth.refreshSession;
let fetchSpy;

beforeEach(() => {
  vi.clearAllMocks();
  fetchSpy = vi.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  fetchSpy.mockRestore();
});

describe('loadSession', () => {
  it('con un token válido deja el usuario sin consultar a Supabase', async () => {
    const req = request({ access_token: await firmarToken() });
    const res = response();
    const next = vi.fn();

    await loadSession(req, res, next);

    expect(req.user).toEqual(USUARIO);
    expect(next).toHaveBeenCalledOnce();
    expect(supabaseAdmin.auth.getUser).not.toHaveBeenCalled();
    expect(refreshSession).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it('con un token vencido y sin refresh token deja la sesión vacía y borra las cookies', async () => {
    const req = request({ access_token: await firmarToken({ vence: haceUnMinuto() }) });
    const res = response();

    await loadSession(req, res, vi.fn());

    expect(req.user).toBeNull();
    expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
  });

  it('con un token vencido y un refresh token válido renueva la sesión', async () => {
    refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-nuevo',
          refresh_token: 'refresh-nuevo',
          expires_in: 3600,
          user: USUARIO,
        },
      },
      error: null,
    });
    const req = request({
      access_token: await firmarToken({ vence: haceUnMinuto() }),
      refresh_token: 'refresh-vigente',
    });
    const res = response();

    await loadSession(req, res, vi.fn());

    expect(refreshSession).toHaveBeenCalledWith({ refresh_token: 'refresh-vigente' });
    expect(req.user).toEqual(USUARIO);
    expect(res.cookie).toHaveBeenCalledWith('access_token', 'access-nuevo', expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-nuevo', expect.any(Object));
  });

  it('con un token mal formado deja la sesión vacía', async () => {
    const req = request({ access_token: 'no-es-un-jwt' });
    const res = response();

    await loadSession(req, res, vi.fn());

    expect(req.user).toBeNull();
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it('rechaza un token firmado con otra clave', async () => {
    const req = request({ access_token: await firmarToken({ clave: otraClavePrivada }) });

    await loadSession(req, response(), vi.fn());

    expect(req.user).toBeNull();
  });

  it('rechaza un token emitido para otro proyecto o con otra audiencia', async () => {
    const otroProyecto = request({
      access_token: await firmarToken({ issuer: 'https://otro.supabase.co/auth/v1' }),
    });
    const anonimo = request({ access_token: await firmarToken({ audience: 'anon' }) });

    await loadSession(otroProyecto, response(), vi.fn());
    await loadSession(anonimo, response(), vi.fn());

    expect(otroProyecto.user).toBeNull();
    expect(anonimo.user).toBeNull();
  });

  it('si no se pueden obtener las claves públicas falla sin borrar las cookies', async () => {
    const verificar = jwks.verificar;
    jwks.verificar = () => Promise.reject(new errors.JWKSTimeout());
    const res = response();

    try {
      await expect(
        loadSession(request({ access_token: await firmarToken() }), res, vi.fn()),
      ).rejects.toBeInstanceOf(ExternalServiceError);
      expect(res.clearCookie).not.toHaveBeenCalled();
    } finally {
      jwks.verificar = verificar;
    }
  });
});

describe('requireSession', () => {
  it('deja pasar un token válido sin hacer pedidos a Supabase Auth', async () => {
    const req = request({ access_token: await firmarToken() });
    const next = vi.fn();

    await requireSession(req, response(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual(USUARIO);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('responde 401 si el token es inválido y no hay refresh token', async () => {
    const req = request({ access_token: await firmarToken({ clave: otraClavePrivada }) });

    await expect(requireSession(req, response(), vi.fn())).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });
});
