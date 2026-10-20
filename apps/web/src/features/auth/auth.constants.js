import { MINUTOS_VENCIMIENTO_ENLACE } from '@buscador/shared/constants';

export const RUTAS_API_AUTH = Object.freeze({
  RECUPERAR_PASSWORD: '/auth/password-recovery',
  RESTABLECER_PASSWORD: '/auth/password-reset',
  CAMBIAR_PASSWORD: '/auth/password-change',
  CAMBIAR_MAIL: '/auth/email-change',
  CONFIRMAR_MAIL: '/auth/email-change/confirm',
  CUENTA: '/auth/account',
});

export const ASIDE_RECUPERAR = Object.freeze({
  titulo: 'Recuperá el acceso a tu cuenta',
  texto: `Te enviamos un enlace por mail para elegir una contraseña nueva. El enlace vence a los ${MINUTOS_VENCIMIENTO_ENLACE} minutos y se puede usar una sola vez.`,
});

export const ASIDE_PASSWORD_NUEVA = Object.freeze({
  titulo: 'Elegí una contraseña nueva',
  texto:
    'Usá una contraseña que no hayas usado en otros sitios. Después vas a poder iniciar sesión con ella.',
});
