import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REGION_SOURCE, TIPO_TITULO } from '@buscador/shared/constants';
import * as registroBusquedaRepository from '../repositories/registroBusqueda.repository.js';
import * as regionService from './region.service.js';
import { registrarBusqueda } from './registroBusqueda.service.js';

vi.mock('../repositories/registroBusqueda.repository.js', () => ({ insertar: vi.fn() }));
vi.mock('./region.service.js', () => ({ obtenerRegion: vi.fn() }));

const USUARIO_ID = 'b7d8e1c2-0000-4000-8000-000000000001';
const IP = '200.1.2.3';

beforeEach(() => {
  vi.clearAllMocks();
  registroBusquedaRepository.insertar.mockResolvedValue(undefined);
  regionService.obtenerRegion.mockResolvedValue({ region: 'AR', source: REGION_SOURCE.IP });
});

describe('registroBusqueda.service', () => {
  it('guarda el texto sin espacios de más y en minúsculas', async () => {
    await registrarBusqueda({
      filtros: {
        q: '  El   Señor de los  ANILLOS ',
        tipo: TIPO_TITULO.PELICULA,
        genero: 'drama',
        anio: 2001,
        pagina: 1,
      },
      ip: IP,
    });

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledWith({
      texto: 'el señor de los anillos',
      tipo: TIPO_TITULO.PELICULA,
      genero: 'drama',
      region: 'AR',
    });
  });

  it('usa la región que detecta el servicio de región', async () => {
    regionService.obtenerRegion.mockResolvedValue({ region: 'MX', source: REGION_SOURCE.PROFILE });

    await registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, usuarioId: USUARIO_ID, ip: IP });

    expect(regionService.obtenerRegion).toHaveBeenCalledWith({ usuarioId: USUARIO_ID, ip: IP });
    expect(registroBusquedaRepository.insertar).toHaveBeenCalledWith(
      expect.objectContaining({ region: 'MX' }),
    );
  });

  it('guarda null en lo que no se buscó ni se pudo detectar', async () => {
    regionService.obtenerRegion.mockResolvedValue({
      region: 'AR',
      source: REGION_SOURCE.DEFAULT,
    });

    await registrarBusqueda({ filtros: { q: '   ', genero: 'comedia', pagina: 1 }, ip: IP });

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledWith({
      texto: null,
      tipo: null,
      genero: 'comedia',
      region: null,
    });
  });

  it('no registra las páginas siguientes', async () => {
    await registrarBusqueda({ filtros: { q: 'dune', pagina: 2 }, ip: IP });

    expect(regionService.obtenerRegion).not.toHaveBeenCalled();
    expect(registroBusquedaRepository.insertar).not.toHaveBeenCalled();
  });

  it('no registra un pedido sin texto ni filtros', async () => {
    await registrarBusqueda({ filtros: { q: '', pagina: 1 }, usuarioId: USUARIO_ID, ip: IP });

    expect(regionService.obtenerRegion).not.toHaveBeenCalled();
    expect(registroBusquedaRepository.insertar).not.toHaveBeenCalled();
  });

  it('propaga el error del repository', async () => {
    registroBusquedaRepository.insertar.mockRejectedValue(new Error('caída'));

    await expect(registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: IP })).rejects.toThrow(
      'caída',
    );
  });
});
