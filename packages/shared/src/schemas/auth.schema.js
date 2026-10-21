import { z } from 'zod';
import { CONFIRMACION_ELIMINAR } from '../constants/index.js';

const email = z.email('Ingresá un mail válido');

const passwordIngresada = z.string().min(1, 'Ingresá tu contraseña');

const linkToken = z
  .string()
  .trim()
  .min(1, 'El enlace no es válido')
  .max(200, 'El enlace no es válido');

// Requisitos de una contraseña segura. El formulario de registro los muestra
// uno por uno mientras se escribe (E4HU2, escenario 3).
export const PASSWORD_REQUIREMENTS = [
  { id: 'min', label: 'Al menos 8 caracteres', pattern: /^.{8,}$/s },
  { id: 'mayuscula', label: 'Una mayúscula', pattern: /[A-Z]/ },
  { id: 'minuscula', label: 'Una minúscula', pattern: /[a-z]/ },
  { id: 'numero', label: 'Un número', pattern: /[0-9]/ },
  { id: 'especial', label: 'Un carácter especial', pattern: /[^A-Za-z0-9]/ },
];

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar los 72 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
  .regex(/[a-z]/, 'La contraseña debe tener al menos una minúscula')
  .regex(/[0-9]/, 'La contraseña debe tener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe tener al menos un carácter especial');

function conConfirmacion(schema, campo) {
  return schema
    .extend({
      confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
    })
    .refine((data) => data[campo] === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
      // Por defecto Zod no corre el refine si otro campo tiene error; así se avisa igual
      when: (payload) =>
        typeof payload.value?.[campo] === 'string' &&
        typeof payload.value?.confirmPassword === 'string' &&
        payload.value.confirmPassword.length > 0,
    });
}

// Registro, cambio y recuperación de contraseña: se validan los criterios de seguridad
export const signUpSchema = z.object({
  email,
  password: passwordSchema,
});

// Formulario de registro: además pide confirmar la contraseña (solo en el front)
export const signUpFormSchema = conConfirmacion(signUpSchema, 'password');

// Inicio de sesión: solo se verifica que venga algo; la contraseña la valida Supabase
export const signInSchema = z.object({
  email,
  password: passwordIngresada,
});

export const passwordRecoverySchema = z.object({ email });

const passwordResetFieldsSchema = z.object({ password: passwordSchema });

export const passwordResetSchema = passwordResetFieldsSchema.extend({ token: linkToken });

export const passwordResetFormSchema = conConfirmacion(passwordResetFieldsSchema, 'password');

const passwordChangeFieldsSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
  newPassword: passwordSchema,
});

const NUEVA_DISTINTA_DE_LA_ACTUAL = [
  (data) => data.newPassword !== data.currentPassword,
  {
    message: 'La contraseña nueva tiene que ser distinta de la actual',
    path: ['newPassword'],
    when: (payload) =>
      typeof payload.value?.currentPassword === 'string' &&
      typeof payload.value?.newPassword === 'string' &&
      payload.value.currentPassword.length > 0,
  },
];

export const passwordChangeSchema = passwordChangeFieldsSchema.refine(
  ...NUEVA_DISTINTA_DE_LA_ACTUAL,
);

export const passwordChangeFormSchema = conConfirmacion(
  passwordChangeFieldsSchema,
  'newPassword',
).refine(...NUEVA_DISTINTA_DE_LA_ACTUAL);

export const passwordConfirmationSchema = z.object({ password: passwordIngresada });

export const emailChangeFormSchema = z.object({ email });

export const emailChangeSchema = emailChangeFormSchema.extend(passwordConfirmationSchema.shape);

export const linkTokenSchema = z.object({ token: linkToken });

export const accountDeletionByTextSchema = z.object({
  confirmation: z.literal(CONFIRMACION_ELIMINAR, {
    error: `Escribí ${CONFIRMACION_ELIMINAR} para confirmar`,
  }),
});

export const accountDeletionSchema = z.union([
  accountDeletionByTextSchema,
  passwordConfirmationSchema,
]);
