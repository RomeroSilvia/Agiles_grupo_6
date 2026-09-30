import { z } from 'zod';

const email = z.email('Ingresá un mail válido');

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

// Inicio de sesión: solo se verifica que venga algo; la contraseña la valida Supabase
export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresá tu contraseña'),
});
