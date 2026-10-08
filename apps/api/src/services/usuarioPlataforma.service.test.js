import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { ExternalServiceError } from '../errors/index.js';
import { NETFLIX } from '../test/fixtures.js';
import { obtenerPlataformasDelUsuarioPorTitulo } from './usuarioPlataforma.service.js';

vi.mock('../integrations/tmdb.integration.js', () => ({ obtenerOfertas: vi.fn() }));

const DISNEY = { ...NETFLIX, id: 3, tmdbProviderId: 337, nombre: 'Disney Plus' };
const PLATAFORMAS = [NETFLIX, DISNEY];
const DUNE = { tipo: 'pelicula', tmdbId: 1 };
const MATRIX = { tipo: 'pelicula', tmdbId: 2 };

function plataformaDeResultado({ id, tmdbProviderId, nombre, logoPath }) {
  return { id, tmdbProviderId, nombre, logoPath };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('obtenerPlataformasDelUsuarioPorTitulo', () => {
  it('devuelve las plataformas del usuario con suscripción, gratis o con anuncios', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValue({
      AR: [
        { tmdbProviderId: 8, tipoOferta: 'suscripcion' },
        { tmdbProviderId: 337, tipoOferta: 'con_anuncios' },
      ],
    });

    const [disponibilidad] = await obtenerPlataformasDelUsuarioPorTitulo({
      titulos: [DUNE],
      region: 'AR',
      plataformas: PLATAFORMAS,
    });

    expect(disponibilidad).toEqual({
      verificado: true,
      plataformas: [plataformaDeResultado(NETFLIX), plataformaDeResultado(DISNEY)],
    });
    expect(tmdbIntegration.obtenerOfertas).toHaveBeenCalledWith(DUNE);
  });

  it('no cuenta alquiler ni compra', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValue({
      AR: [
        { tmdbProviderId: 8, tipoOferta: 'alquiler' },
        { tmdbProviderId: 337, tipoOferta: 'compra' },
      ],
    });

    const [disponibilidad] = await obtenerPlataformasDelUsuarioPorTitulo({
      titulos: [DUNE],
      region: 'AR',
      plataformas: PLATAFORMAS,
    });

    expect(disponibilidad.plataformas).toEqual([]);
  });

  it('usa solo las ofertas de la región del usuario', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValue({
      MX: [{ tmdbProviderId: 8, tipoOferta: 'suscripcion' }],
    });

    const [disponibilidad] = await obtenerPlataformasDelUsuarioPorTitulo({
      titulos: [DUNE],
      region: 'AR',
      plataformas: PLATAFORMAS,
    });

    expect(disponibilidad).toEqual({ verificado: true, plataformas: [] });
  });

  it('ignora plataformas que el usuario no tiene', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValue({
      AR: [{ tmdbProviderId: 350, tipoOferta: 'suscripcion' }],
    });

    const [disponibilidad] = await obtenerPlataformasDelUsuarioPorTitulo({
      titulos: [DUNE],
      region: 'AR',
      plataformas: PLATAFORMAS,
    });

    expect(disponibilidad.plataformas).toEqual([]);
  });

  it('usa el logo de TMDB si la plataforma no tiene uno propio', async () => {
    tmdbIntegration.obtenerOfertas.mockResolvedValue({
      AR: [{ tmdbProviderId: 8, tipoOferta: 'suscripcion', logoPath: '/netflix.jpg' }],
    });

    const [disponibilidad] = await obtenerPlataformasDelUsuarioPorTitulo({
      titulos: [DUNE],
      region: 'AR',
      plataformas: [NETFLIX, { ...DISNEY, logoPath: '/disney-propio.jpg' }],
    });

    expect(disponibilidad.plataformas).toEqual([
      { ...plataformaDeResultado(NETFLIX), logoPath: '/netflix.jpg' },
    ]);
  });

  it('marca como no verificado el título cuya consulta falla, sin afectar a los demás', async () => {
    tmdbIntegration.obtenerOfertas
      .mockRejectedValueOnce(new ExternalServiceError('TMDB', new Error('caída')))
      .mockResolvedValueOnce({ AR: [{ tmdbProviderId: 8, tipoOferta: 'suscripcion' }] });

    const disponibilidades = await obtenerPlataformasDelUsuarioPorTitulo({
      titulos: [DUNE, MATRIX],
      region: 'AR',
      plataformas: PLATAFORMAS,
    });

    expect(disponibilidades).toEqual([
      { verificado: false, plataformas: [] },
      { verificado: true, plataformas: [plataformaDeResultado(NETFLIX)] },
    ]);
  });
});
