import { z } from 'zod';

const email = z.email('Ingresá un mail válido');

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

// Registro, cambio y recuperación de contraseña: se validan los criterios de seguridad
export const signUpSchema = z.object({
  email,
  password: passwordSchema,
});

// Formulario de registro: además pide confirmar la contraseña (solo en el front)
export const signUpFormSchema = signUpSchema
  .extend({
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
    // Por defecto Zod no corre el refine si otro campo tiene error; así se avisa igual
    when: (payload) =>
      typeof payload.value?.password === 'string' &&
      typeof payload.value?.confirmPassword === 'string' &&
      payload.value.confirmPassword.length > 0,
  });

// Inicio de sesión: solo se verifica que venga algo; la contraseña la valida Supabase
export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresá tu contraseña'),
});
