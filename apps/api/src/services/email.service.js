import * as smtpIntegration from '../integrations/smtp.integration.js';
import { LOGO_ATTACHMENT } from '../emails/layout.email.js';
import { mailRecuperacionPassword } from '../emails/recuperacionPassword.email.js';
import { mailConfirmacionCambioMail } from '../emails/confirmacionCambioMail.email.js';
import { mailAvisoCambioMail } from '../emails/avisoCambioMail.email.js';

function enviar(destinatario, mail) {
  return smtpIntegration.sendEmail({ to: destinatario, ...mail, attachments: [LOGO_ATTACHMENT] });
}

export function enviarRecuperacionPassword(email, enlace) {
  return enviar(email, mailRecuperacionPassword({ enlace }));
}

export function enviarConfirmacionCambioMail(nuevoEmail, enlace) {
  return enviar(nuevoEmail, mailConfirmacionCambioMail({ enlace }));
}

export function enviarAvisoCambioMail(emailAnterior, nuevoEmail) {
  return enviar(emailAnterior, mailAvisoCambioMail({ nuevoEmail }));
}
