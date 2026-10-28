import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExternalServiceError } from '../errors/index.js';
import { sendEmail } from './resend.integration.js';

const envMock = vi.hoisted(() => ({ env: {} }));

vi.mock('../config/env.config.js', () => envMock);
vi.mock('node:fs/promises', () => ({ readFile: vi.fn(async () => Buffer.from('png')) }));

const fetchMock = vi.fn();

const MAIL = {
  to: 'ana@mail.com',
  subject: 'Asunto',
  html: '<p>Hola</p>',
  text: 'Hola',
  attachments: [{ filename: 'logo.png', path: '/logo.png', cid: 'logo' }],
  idempotencyKey: 'aviso-disponibilidad/1-2',
};

function respuesta(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  envMock.env = { RESEND_API_KEY: 're_prueba', RESEND_FROM: 'Streamly <avisos@streamly.com>' };
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendEmail', () => {
  it('manda el mail con el logo en línea y la clave de idempotencia', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { id: 'abc' }));

    await sendEmail(MAIL);

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(opciones.method).toBe('POST');
    expect(opciones.headers).toMatchObject({
      Authorization: 'Bearer re_prueba',
      'Idempotency-Key': 'aviso-disponibilidad/1-2',
    });
    expect(JSON.parse(opciones.body)).toEqual({
      from: 'Streamly <avisos@streamly.com>',
      to: ['ana@mail.com'],
      subject: 'Asunto',
      html: '<p>Hola</p>',
      text: 'Hola',
      attachments: [
        {
          filename: 'logo.png',
          content: Buffer.from('png').toString('base64'),
          content_id: 'logo',
        },
      ],
    });
  });

  it('no llama a Resend si falta la configuración', async () => {
    envMock.env = {};

    await expect(sendEmail(MAIL)).rejects.toBeInstanceOf(ExternalServiceError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lanza ExternalServiceError con el estado HTTP si Resend rechaza el mail', async () => {
    fetchMock.mockResolvedValue(respuesta(429, { message: 'Too many requests' }));

    const error = await sendEmail(MAIL).catch((e) => e);

    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.cause.status).toBe(429);
    expect(error.cause.message).toContain('Too many requests');
  });

  it('lanza ExternalServiceError si no hay conexión', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(sendEmail(MAIL)).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
