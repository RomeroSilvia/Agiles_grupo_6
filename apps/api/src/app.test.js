import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('GET /api/health', () => {
  it('responde 200 cuando la API está levantada', async () => {
    const res = await request(createApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });

  it('responde 404 para una ruta que no existe', async () => {
    const res = await request(createApp()).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).not.toContain('/api/no-existe');
  });

  it('responde 400 si el cuerpo no es JSON válido', async () => {
    const res = await request(createApp())
      .post('/api/auth/sign-in')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});
