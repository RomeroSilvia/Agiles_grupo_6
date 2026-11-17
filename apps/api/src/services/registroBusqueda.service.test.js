import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REGION_SOURCE, TIPO_TITULO } from '@buscador/shared/constants';
import { REGISTRO_BUSQUEDA } from '../config/busqueda.config.js';

vi.mock('../repositories/registroBusqueda.repository.js', () => ({ insertar: vi.fn() }));
vi.mock('./region.service.js', () => ({ obtenerRegion: vi.fn() }));

const USUARIO_ID = 'b7d8e1c2-0000-4000-8000-000000000001';
const IP = '200.1.2.3';
const OTRA_IP = '200.9.9.9';

let registrarBusqueda;
let registroBusquedaRepository;
let regionService;

// El cache de búsquedas recientes es del módulo: se importa de nuevo en cada test para que
// empiece vacío y use el reloj falso
beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  ({ registrarBusqueda } = await import('./registroBusqueda.service.js'));
  registroBusquedaRepository = await import('../repositories/registroBusqueda.repository.js');
  regionService = await import('./region.service.js');

  registroBusquedaRepository.insertar.mockResolvedValue(undefined);
  regionService.obtenerRegion.mockResolvedValue({ region: 'AR', source: REGION_SOURCE.IP });
});

afterEach(() => {
  vi.useRealTimers();
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

describe('búsquedas repetidas', () => {
  it('no registra otra vez el mismo texto desde la misma IP aunque cambien los filtros', async () => {
    await registrarBusqueda({ filtros: { q: 'Dune', pagina: 1 }, ip: IP });
    await registrarBusqueda({ filtros: { q: '  dune ', pagina: 1 }, ip: IP });
    await registrarBusqueda({
      filtros: { q: 'DUNE', tipo: TIPO_TITULO.SERIE, genero: 'drama', pagina: 1 },
      ip: IP,
    });

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledTimes(1);
    expect(regionService.obtenerRegion).toHaveBeenCalledTimes(1);
  });

  it('registra el mismo texto si viene de otra IP', async () => {
    await registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: IP });
    await registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: OTRA_IP });

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledTimes(2);
  });

  it('vuelve a registrar el texto cuando pasa la ventana', async () => {
    await registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: IP });
    vi.advanceTimersByTime(REGISTRO_BUSQUEDA.VENTANA_REPETIDAS_MS - 1);
    await registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: IP });
    vi.advanceTimersByTime(1);
    await registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: IP });

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledTimes(2);
  });

  it('sin texto, registra por separado las búsquedas con filtros distintos', async () => {
    await registrarBusqueda({ filtros: { genero: 'drama', pagina: 1 }, ip: IP });
    await registrarBusqueda({ filtros: { genero: 'drama', pagina: 1 }, ip: IP });
    await registrarBusqueda({ filtros: { genero: 'comedia', pagina: 1 }, ip: IP });
    await registrarBusqueda({
      filtros: { genero: 'comedia', tipo: TIPO_TITULO.PELICULA, pagina: 1 },
      ip: IP,
    });

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledTimes(3);
  });

  it('vuelve a intentar el registro si el anterior falló', async () => {
    registroBusquedaRepository.insertar.mockRejectedValueOnce(new Error('caída'));

    await expect(registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: IP })).rejects.toThrow(
      'caída',
    );
    await registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: IP });

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledTimes(2);
  });

  it('registra un solo pedido cuando llegan dos iguales a la vez', async () => {
    await Promise.all([
      registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: IP }),
      registrarBusqueda({ filtros: { q: 'dune', pagina: 1 }, ip: IP }),
    ]);

    expect(registroBusquedaRepository.insertar).toHaveBeenCalledTimes(1);
  });
});
