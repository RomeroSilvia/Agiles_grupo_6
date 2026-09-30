import { useCallback, useMemo, useState } from 'react';

function erroresPorCampo(result) {
  if (result.success) {
    return {};
  }
  const errores = {};
  for (const issue of result.error.issues) {
    const campo = issue.path[0];
    if (campo !== undefined && !errores[campo]) {
      errores[campo] = issue.message;
    }
  }
  return errores;
}

/**
 * Estado y validación de un formulario con un esquema Zod compartido con la API.
 * Cada error aparece recién cuando el usuario sale del campo (o al enviar),
 * y desde ahí se actualiza mientras escribe.
 *
 * @example
 * const { values, field, validate } = useZodForm(signInSchema, { email: '', password: '' });
 * <TextField label="Mail" {...field('email')} />
 * // en onSubmit: const datos = validate(event.currentTarget); if (!datos) return;
 *
 * @param {import('zod').ZodType} schema
 * @param {Record<string, string>} initialValues
 */
export function useZodForm(schema, initialValues) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => erroresPorCampo(schema.safeParse(values)), [schema, values]);

  const field = useCallback(
    (name) => ({
      name,
      value: values[name],
      onChange: (event) => setValues((current) => ({ ...current, [name]: event.target.value })),
      onBlur: () => setTouched((current) => ({ ...current, [name]: true })),
      error: touched[name] || submitted ? errors[name] : undefined,
    }),
    [values, touched, submitted, errors],
  );

  /**
   * Muestra todos los errores y lleva el foco al primer campo inválido.
   * @param {HTMLFormElement} [form]
   * @returns los datos parseados, o null si hay errores
   */
  const validate = useCallback(
    (form) => {
      setSubmitted(true);
      const result = schema.safeParse(values);
      if (!result.success) {
        const primerCampo = result.error.issues[0]?.path[0];
        form?.elements.namedItem(String(primerCampo))?.focus();
        return null;
      }
      return result.data;
    },
    [schema, values],
  );

  return { values, field, validate };
}
