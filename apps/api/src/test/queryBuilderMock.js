import { vi } from 'vitest';

const METODOS = ['select', 'eq', 'order', 'upsert', 'delete', 'maybeSingle'];

export const SIN_DATOS = { data: null, error: null };
export const FALLO = { data: null, error: { message: 'caída' } };

export function mockearConsulta(from, resultado) {
  const builder = {
    then: (resolve, reject) => Promise.resolve(resultado).then(resolve, reject),
  };
  for (const metodo of METODOS) {
    builder[metodo] = vi.fn(() => builder);
  }
  from.mockReturnValue(builder);
  return builder;
}
