import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TMDB_API_TOKEN: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  throw new Error('Las variables de entorno son inválidas');
}

export const env = Object.freeze(result.data);
