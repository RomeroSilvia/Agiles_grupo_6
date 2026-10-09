import { describe, it, expect } from 'vitest';
import { envSchema } from './env.config.js';

const REQUIRED_ENV = {
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_PUBLISHABLE_KEY: 'clave-publica-de-prueba',
  SUPABASE_SECRET_KEY: 'clave-secreta-de-prueba',
};

describe('env.config', () => {
  it('acepta IPs y subredes de confianza separadas por comas', () => {
    const result = envSchema.safeParse({
      ...REQUIRED_ENV,
      TRUST_PROXY: '127.0.0.1, 10.0.0.0/8, ::1, fc00::/7',
    });

    expect(result.success).toBe(true);
  });

  it.each(['true', '1', '0.0.0.0/0', '10.0.0.0/33', '10.0.0.0/8, true'])(
    'rechaza TRUST_PROXY=%s con un mensaje claro',
    (value) => {
      const result = envSchema.safeParse({ ...REQUIRED_ENV, TRUST_PROXY: value });

      expect(result.success).toBe(false);
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['TRUST_PROXY'],
            message: expect.stringContaining('TRUST_PROXY debe contener IPs'),
          }),
        ]),
      );
    },
  );
});
