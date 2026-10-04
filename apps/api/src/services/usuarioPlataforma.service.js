import { TIPOS_OFERTA_INCLUIDOS } from '@buscador/shared/constants';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';

function aPlataformaDeResultado({ id, tmdbProviderId, nombre, logoPath }) {
  return { id, tmdbProviderId, nombre, logoPath };
}

function plataformasConOfertaIncluida(ofertasDeRegion, plataformas) {
  const proveedoresDisponibles = new Set(
    ofertasDeRegion
      .filter(({ tipoOferta }) => TIPOS_OFERTA_INCLUIDOS.includes(tipoOferta))
      .map(({ tmdbProviderId }) => tmdbProviderId),
  );

  return plataformas
    .filter(({ tmdbProviderId }) => proveedoresDisponibles.has(tmdbProviderId))
    .map(aPlataformaDeResultado);
}

export async function obtenerPlataformasDelUsuarioPorTitulo({ titulos, region, plataformas }) {
  const consultas = await Promise.allSettled(
    titulos.map(({ tipo, tmdbId }) => tmdbIntegration.obtenerOfertas({ tipo, tmdbId })),
  );

  return consultas.map((consulta) =>
    consulta.status === 'fulfilled'
      ? {
          verificado: true,
          plataformas: plataformasConOfertaIncluida(consulta.value[region] ?? [], plataformas),
        }
      : { verificado: false, plataformas: [] },
  );
}
