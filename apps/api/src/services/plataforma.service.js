import { TIPOS_OFERTA_INCLUIDOS } from '@buscador/shared/constants';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import * as usuarioPlataformaRepository from '../repositories/usuarioPlataforma.repository.js';
import { NotFoundError } from '../errors/index.js';

export function filtrarPlataformasConOfertaIncluida(ofertasDeRegion, plataformas) {
  const ofertasPorProveedor = new Map(
    ofertasDeRegion
      .filter(({ tipoOferta }) => TIPOS_OFERTA_INCLUIDOS.includes(tipoOferta))
      .map((oferta) => [oferta.tmdbProviderId, oferta]),
  );

  return plataformas
    .filter(({ tmdbProviderId }) => ofertasPorProveedor.has(tmdbProviderId))
    .map((plataforma) => ({
      ...plataforma,
      logoPath:
        plataforma.logoPath ?? ofertasPorProveedor.get(plataforma.tmdbProviderId).logoPath ?? null,
    }));
}

export function agruparPlataformasPorTipoOferta(ofertasDeRegion, plataformas) {
  return TIPOS_OFERTA_INCLUIDOS.flatMap((tipoOferta) => {
    const ofertasPorProveedor = new Map(
      ofertasDeRegion
        .filter((oferta) => oferta.tipoOferta === tipoOferta)
        .map((oferta) => [oferta.tmdbProviderId, oferta]),
    );
    const plataformasDisponibles = plataformas
      .filter(({ tmdbProviderId }) => ofertasPorProveedor.has(tmdbProviderId))
      .map((plataforma) => ({
        ...plataforma,
        logoPath:
          plataforma.logoPath ??
          ofertasPorProveedor.get(plataforma.tmdbProviderId).logoPath ??
          null,
      }));

    return plataformasDisponibles.length > 0
      ? [{ tipoOferta, plataformas: plataformasDisponibles }]
      : [];
  });
}

export function listarPlataformasDisponibles() {
  return plataformaRepository.listarActivas();
}

export async function listarPlataformasPropias(usuarioId) {
  const propias = await usuarioPlataformaRepository.listarPlataformasActivasPorUsuario(usuarioId);
  return propias.map(({ id }) => id);
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
