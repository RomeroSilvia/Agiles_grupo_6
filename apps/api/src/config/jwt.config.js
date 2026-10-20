import { createRemoteJWKSet } from 'jose';
import { env } from './env.config.js';

/**
 * Claves públicas (JWKS) con las que Supabase Auth firma los access tokens.
 * `jose` las descarga la primera vez que se usan y las guarda en memoria: solo vuelve a
 * pedirlas si aparece un token firmado con una clave que no conoce (rotación de claves).
 */
export const supabaseJwks = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

/** Claims que tiene que cumplir un access token de sesión emitido por este proyecto. */
export const JWT_CONFIG = Object.freeze({
  ISSUER: `${env.SUPABASE_URL}/auth/v1`,
  AUDIENCE: 'authenticated',
});
