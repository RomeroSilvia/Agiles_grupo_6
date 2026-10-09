import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as plataformaService from './plataforma.service.js';

function aPlataformaDeResultado({ id, tmdbProviderId, nombre, logoPath }) {
  return { id, tmdbProviderId, nombre, logoPath };
}

export async function obtenerPlataformasDelUsuarioPorTitulo({ titulos, region, plataformas }) {
  const consultas = await Promise.allSettled(
    titulos.map(({ tipo, tmdbId }) => tmdbIntegration.obtenerOfertas({ tipo, tmdbId })),
  );

  return consultas.map((consulta) =>
    consulta.status === 'fulfilled'
      ? {
          verificado: true,
          plataformas: plataformaService
            .filtrarPlataformasConOfertaIncluida(consulta.value[region]?.ofertas ?? [], plataformas)
            .map(aPlataformaDeResultado),
        }
      : { verificado: false, plataformas: [] },
  );
}
