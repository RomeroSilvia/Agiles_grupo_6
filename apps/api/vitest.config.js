import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Valores ficticios para que config/env.config.js valide sin un .env real.
    // Los tests NUNCA llegan a Supabase (la base es compartida): se mockean los repositorios.
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_PUBLISHABLE_KEY: 'clave-publica-de-prueba',
      SUPABASE_SECRET_KEY: 'clave-secreta-de-prueba',
    },
  },
});
