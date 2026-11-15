import { describe, expect, it } from 'vitest';
import { MAX_LARGO_BUSQUEDA_MAIL, PAGINA_MAXIMA_USUARIOS } from '../constants/index.js';
import { usuariosAdminSchema } from './usuariosAdmin.schema.js';

describe('usuariosAdminSchema', () => {
  it('sin filtros pide la página 1', () => {
    expect(usuariosAdminSchema.parse({})).toEqual({ pagina: 1 });
  });

  it('acepta mail, región, estado y página combinados', () => {
    expect(
      usuariosAdminSchema.parse({ mail: ' ana ', region: 'AR', estado: 'activo', pagina: '3' }),
    ).toEqual({ mail: 'ana', region: 'AR', estado: 'activo', pagina: 3 });
  });

  it('rechaza estado y región inválidos, páginas fuera de rango y claves extra', () => {
    for (const query of [
      { estado: 'bloqueado' },
      { region: 'arg' },
      { pagina: '0' },
      { pagina: String(PAGINA_MAXIMA_USUARIOS + 1) },
      { pagina: '1.5' },
      { mail: 'a'.repeat(MAX_LARGO_BUSQUEDA_MAIL + 1) },
      { orden: 'mail' },
    ]) {
      expect(usuariosAdminSchema.safeParse(query).success).toBe(false);
    }
  });
});
