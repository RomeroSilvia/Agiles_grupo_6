import { APP_NAME, MINUTOS_VENCIMIENTO_ENLACE } from '@buscador/shared/constants';
import { renderEmail } from './layout.email.js';

export function mailRecuperacionPassword({ enlace }) {
  return {
    subject: `Restablecé tu contraseña de ${APP_NAME}`,
    ...renderEmail({
      preheader: 'Elegí una contraseña nueva para tu cuenta.',
      titulo: 'Restablecé tu contraseña',
      parrafos: [
        `Recibimos un pedido para restablecer la contraseña de tu cuenta de ${APP_NAME}.`,
        'Tocá el botón para elegir una contraseña nueva.',
      ],
      accion: { texto: 'Elegir contraseña nueva', url: enlace },
      nota: `El enlace vence a los ${MINUTOS_VENCIMIENTO_ENLACE} minutos y se puede usar una sola vez. Si no lo pediste, ignorá este mail: tu contraseña no cambia.`,
    }),
  };
}
