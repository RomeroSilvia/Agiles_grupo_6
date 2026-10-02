import { vi } from 'vitest';

const METODOS = ['select', 'eq', 'order', 'upsert', 'delete', 'maybeSingle'];

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
