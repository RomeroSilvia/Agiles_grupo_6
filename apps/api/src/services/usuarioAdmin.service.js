import { USUARIOS_POR_PAGINA } from '@buscador/shared/constants';
import * as usuarioAdminRepository from '../repositories/usuarioAdmin.repository.js';

export async function listarUsuarios({ pagina, ...filtros }) {
  const { total, usuarios } = await usuarioAdminRepository.listarUsuarios({
    ...filtros,
    limite: USUARIOS_POR_PAGINA,
    offset: (pagina - 1) * USUARIOS_POR_PAGINA,
  });

  return {
    usuarios,
    total,
    pagina,
    totalPaginas: Math.ceil(total / USUARIOS_POR_PAGINA),
  };
}
