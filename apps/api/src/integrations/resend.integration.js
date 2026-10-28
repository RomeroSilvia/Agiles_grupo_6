import { readFile } from 'node:fs/promises';
import { env } from '../config/env.config.js';
import { ExternalServiceError } from '../errors/index.js';

const SERVICIO = 'el servicio de avisos por mail';
const URL_ENVIO = 'https://api.resend.com/emails';
const TIMEOUT_MS = 10_000;

// Resend recibe los adjuntos en Base64 y las imágenes que se muestran dentro del mail
// se referencian con content_id (el mismo cid del HTML).
async function toResendAttachment({ filename, path, cid }) {
  const contenido = await readFile(path);
  return { filename, content: contenido.toString('base64'), content_id: cid };
}

/**
 * La clave de idempotencia evita que Resend mande dos veces el mismo mail si se reintenta
 * un envío que en realidad había salido (Resend la recuerda 24 horas).
 */
export async function sendEmail({ to, subject, html, text, attachments = [], idempotencyKey }) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    throw new ExternalServiceError(
      SERVICIO,
      new Error('Falta configurar RESEND_API_KEY o RESEND_FROM'),
    );
  }

  const body = JSON.stringify({
    from: env.RESEND_FROM,
    to: [to],
    subject,
    html,
    text,
    attachments: await Promise.all(attachments.map(toResendAttachment)),
  });

  let response;
  try {
    response = await fetch(URL_ENVIO, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ExternalServiceError(SERVICIO, error);
  }

  if (!response.ok) {
    const detalle = await response.json().catch(() => null);
    const cause = new Error(`HTTP ${response.status}: ${detalle?.message ?? 'sin detalle'}`);
    cause.status = response.status;
    throw new ExternalServiceError(SERVICIO, cause);
  }
}
