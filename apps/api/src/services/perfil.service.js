import { ROL_USUARIO } from '@buscador/shared/constants';
import * as perfilRepository from '../repositories/perfil.repository.js';

export async function esAdministrador(usuarioId) {
  return (await perfilRepository.obtenerRol(usuarioId)) === ROL_USUARIO.ADMINISTRADOR;
}
