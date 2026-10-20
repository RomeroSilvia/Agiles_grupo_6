import { APP_NAME, MINUTOS_VENCIMIENTO_ENLACE } from '@buscador/shared/constants';
import { renderEmail } from './layout.email.js';

export function mailConfirmacionCambioMail({ enlace }) {
  return {
    subject: `Confirmá tu nuevo mail de ${APP_NAME}`,
    ...renderEmail({
      preheader: 'Confirmá el cambio de mail de tu cuenta.',
      titulo: 'Confirmá tu nuevo mail',
      parrafos: [
        `Pediste usar este mail en tu cuenta de ${APP_NAME}.`,
        'Tocá el botón para confirmarlo. Hasta que lo confirmes, seguís ingresando con tu mail actual.',
      ],
      accion: { texto: 'Confirmar mail', url: enlace },
      nota: `El enlace vence a los ${MINUTOS_VENCIMIENTO_ENLACE} minutos y se puede usar una sola vez. Si no lo pediste, ignorá este mail.`,
    }),
  };
}
