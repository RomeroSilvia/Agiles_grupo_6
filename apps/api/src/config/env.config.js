import { z } from 'zod';
import { REGION_PATTERN } from '@buscador/shared/constants';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  DEFAULT_REGION: z.string().regex(REGION_PATTERN).default('AR'),
  TMDB_API_KEY: z.string().optional(),
  STREAMING_AVAILABILITY_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    'Variables de entorno inválidas (revisá apps/api/.env, ver .env.example):\n' +
      z.prettifyError(result.error),
  );
  process.exit(1);
}

export const env = Object.freeze(result.data);
