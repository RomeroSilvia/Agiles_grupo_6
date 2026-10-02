import * as plataformaRepository from '../repositories/plataforma.repository.js';
import * as usuarioPlataformaRepository from '../repositories/usuarioPlataforma.repository.js';
import { NotFoundError } from '../errors/index.js';

export function listarPlataformasDisponibles() {
  return plataformaRepository.listarActivas();
}

export function listarPlataformasPropias(usuarioId) {
  return usuarioPlataformaRepository.listarPlataformaIds(usuarioId);
}

export async function agregarPlataformaPropia(usuarioId, plataformaId) {
  const plataforma = await plataformaRepository.obtenerActivaPorId(plataformaId);
  if (!plataforma) {
    throw new NotFoundError('La plataforma no existe');
  }
  await usuarioPlataformaRepository.agregar(usuarioId, plataformaId);
}

export function quitarPlataformaPropia(usuarioId, plataformaId) {
  return usuarioPlataformaRepository.quitar(usuarioId, plataformaId);
}
