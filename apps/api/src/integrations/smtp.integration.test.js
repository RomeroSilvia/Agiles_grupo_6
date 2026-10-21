import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { ExternalServiceError } from '../errors/index.js';
import { sendEmail } from './smtp.integration.js';

const sendMail = vi.fn();

vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn(() => ({ sendMail })) } }));

vi.mock('../config/env.config.js', () => ({
  env: {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 465,
    SMTP_USER: 'streamly@gmail.com',
    SMTP_PASSWORD: 'clave-de-aplicacion',
    MAIL_FROM: 'Streamly <streamly@gmail.com>',
  },
}));

const MAIL = { to: 'ana@mail.com', subject: 'Asunto', html: '<p>Hola</p>', text: 'Hola' };

beforeEach(() => {
  sendMail.mockReset();
});

describe('sendEmail', () => {
  it('manda el mail desde MAIL_FROM por una conexión segura', async () => {
    sendMail.mockResolvedValue({});

    await sendEmail(MAIL);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.gmail.com', port: 465, secure: true }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ ...MAIL, from: 'Streamly <streamly@gmail.com>' }),
    );
  });

  it('lanza ExternalServiceError si el envío falla', async () => {
    sendMail.mockRejectedValue(new Error('Invalid login'));

    await expect(sendEmail(MAIL)).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
