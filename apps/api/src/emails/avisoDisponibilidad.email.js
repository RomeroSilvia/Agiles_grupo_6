import { APP_NAME } from '@buscador/shared/constants';
import { renderEmail } from './layout.email.js';

const listaPlataformas = new Intl.ListFormat('es', { type: 'conjunction' });

export function mailAvisoDisponibilidad({ titulo, plataformas, enlace }) {
  const nombre = titulo.anio ? `${titulo.nombre} (${titulo.anio})` : titulo.nombre;
  const dondeVerlo = listaPlataformas.format(plataformas);

  return {
    subject: `${titulo.nombre} ya está disponible en ${dondeVerlo}`,
    ...renderEmail({
      preheader: `Un título de tu watchlist llegó a ${dondeVerlo}.`,
      titulo: `${titulo.nombre} ya está disponible`,
      parrafos: [
        `${nombre}, que tenés en tu watchlist, ahora se puede ver en ${dondeVerlo}.`,
        'Entrá para ver si está incluido en tu suscripción o si se alquila o se compra.',
      ],
      accion: { texto: 'Ver dónde verlo', url: enlace },
      nota: 'Si no querés recibir más avisos de este título, quitalo de tu watchlist.',
      pie: `Recibiste este mail porque tenés los avisos activos en tu watchlist de ${APP_NAME}.`,
    }),
  };
}
