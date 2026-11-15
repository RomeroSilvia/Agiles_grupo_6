import { USUARIOS_POR_PAGINA } from '@buscador/shared/constants';
import { env } from '../config/env.config.js';
import * as usuarioAdminRepository from '../repositories/usuarioAdmin.repository.js';

export async function listarUsuarios({ pagina, ...filtros }) {
  const { total, usuarios } = await usuarioAdminRepository.listarUsuarios({
    ...filtros,
    limite: USUARIOS_POR_PAGINA,
    offset: (pagina - 1) * USUARIOS_POR_PAGINA,
  });

  return {
    usuarios: usuarios.map((usuario) => ({
      ...usuario,
      region: usuario.region ?? env.DEFAULT_REGION,
    })),
    total,
    pagina,
    totalPaginas: Math.ceil(total / USUARIOS_POR_PAGINA),
  };
}
