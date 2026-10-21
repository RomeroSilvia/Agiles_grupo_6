import nodemailer from 'nodemailer';
import { env } from '../config/env.config.js';
import { ExternalServiceError } from '../errors/index.js';

const SERVICIO = 'el servicio de mails';
const TIMEOUT_MS = 10_000;
const PUERTO_SMTP_SEGURO = 465;

let transporter;

function obtenerTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.MAIL_FROM) {
    throw new ExternalServiceError(
      SERVICIO,
      new Error('Falta configurar SMTP_HOST, SMTP_USER, SMTP_PASSWORD o MAIL_FROM'),
    );
  }

  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === PUERTO_SMTP_SEGURO,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
  return transporter;
}

export async function sendEmail({ to, subject, html, text, attachments }) {
  const transport = obtenerTransporter();
  try {
    await transport.sendMail({ from: env.MAIL_FROM, to, subject, html, text, attachments });
  } catch (error) {
    throw new ExternalServiceError(SERVICIO, error);
  }
}
