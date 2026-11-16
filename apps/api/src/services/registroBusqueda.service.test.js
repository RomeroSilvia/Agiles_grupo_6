import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TIPO_TITULO } from '@buscador/shared/constants';
import * as registroBusquedaRepository from '../repositories/registroBusqueda.repository.js';
import { registrarBusqueda } from './registroBusqueda.service.js';

vi.mock('../repositories/registroBusqueda.repository.js', () => ({ insertar: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  registroBusquedaRepository.insertar.mockResolvedValue(undefined);
});

describe('registroBusqueda.service', () => {
  it('guarda el texto sin espacios de más y en minúsculas', async () => {
    await registrarBusqueda({
      q: '  El   Señor de los  ANILLOS ',
      tipo: TIPO_TITULO.PELICULA,
      genero: 'drama',
      region: 'AR',
      anio: 2001,
      pagina: 1,
    });

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledWith({
      texto: 'el señor de los anillos',
      tipo: TIPO_TITULO.PELICULA,
      genero: 'drama',
      region: 'AR',
    });
  });

  it('guarda null en lo que no se buscó ni se pudo detectar', async () => {
    await registrarBusqueda({ q: '   ', genero: 'comedia' });

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledWith({
      texto: null,
      tipo: null,
      genero: 'comedia',
      region: null,
    });
  });

  it('propaga el error del repository', async () => {
    registroBusquedaRepository.insertar.mockRejectedValue(new Error('caída'));

    await expect(registrarBusqueda({ q: 'dune' })).rejects.toThrow('caída');
  });
});
