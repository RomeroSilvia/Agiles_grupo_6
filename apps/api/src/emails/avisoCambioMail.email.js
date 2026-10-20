import { APP_NAME } from '@buscador/shared/constants';
import { renderEmail } from './layout.email.js';

export function mailAvisoCambioMail({ nuevoEmail }) {
  return {
    subject: `Cambió el mail de tu cuenta de ${APP_NAME}`,
    ...renderEmail({
      preheader: 'El mail de tu cuenta cambió.',
      titulo: 'Cambió el mail de tu cuenta',
      parrafos: [
        `El mail de tu cuenta de ${APP_NAME} ahora es ${nuevoEmail}.`,
        'Desde ahora iniciás sesión con ese mail y los avisos llegan ahí.',
      ],
      nota: 'Si no hiciste este cambio, respondé este mail para que te ayudemos a recuperar tu cuenta.',
    }),
  };
}
