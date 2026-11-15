import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CiudadCineProvider } from './CiudadCineProvider.jsx';
import { useCiudadCine } from './CiudadCineContext.js';

const ciudadDisponible = {
  id: 'ar:550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Córdoba',
  provincia: 'Córdoba',
  pais: 'AR',
  zonaHoraria: 'America/Argentina/Cordoba',
  cobertura: 'disponible',
  fuente: {
    fuenteId: 'serpapi',
    registroId: 'cordoba',
    url: null,
    consultadoEn: '2026-11-13T10:00:00.000Z',
    actualizadoEn: null,
  },
};

const ciudadSinCobertura = {
  ...ciudadDisponible,
  id: 'ar:550e8400-e29b-41d4-a716-446655440001',
  nombre: 'Villa María',
  cobertura: 'sin_cobertura',
};

function Consumidor() {
  const { ciudadSeleccionada, seleccionarCiudad, aviso, cargarDirectorio } = useCiudadCine();

  useEffect(() => {
    cargarDirectorio();
  }, [cargarDirectorio]);

  return (
    <>
      <p>{ciudadSeleccionada?.nombre ?? 'Sin ciudad'}</p>
      {aviso && <p role="status">{aviso}</p>}
      <button onClick={() => seleccionarCiudad(ciudadDisponible.id)}>Elegir Córdoba</button>
    </>
  );
}

function respuestaCiudades(ciudades = [ciudadDisponible, ciudadSinCobertura]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data: { pais: 'AR', ciudades } }),
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaCiudades()));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CiudadCineProvider', () => {
  it('permite seleccionar y restaurar ubicaciones por verificar sin cambiar su cobertura', async () => {
    const sinVerificar = { ...ciudadDisponible, cobertura: 'sin_verificar' };
    fetch.mockResolvedValue(respuestaCiudades([sinVerificar]));
    const { unmount } = render(
      <CiudadCineProvider>
        <Consumidor />
      </CiudadCineProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Elegir Córdoba' }));
    expect(await screen.findByText('Córdoba')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('streamly.ciudadCine')).toBe(sinVerificar.id);
    unmount();
    render(
      <CiudadCineProvider>
        <Consumidor />
      </CiudadCineProvider>,
    );
    expect(await screen.findByText('Córdoba')).toBeInTheDocument();
  });
  it('no consulta el directorio hasta que un consumidor lo necesita', () => {
    render(
      <CiudadCineProvider>
        <p>Otra pantalla</p>
      </CiudadCineProvider>,
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it('restaura únicamente una ciudad existente con cobertura verificada', async () => {
    window.sessionStorage.setItem('streamly.ciudadCine', ciudadDisponible.id);
    render(
      <CiudadCineProvider>
        <Consumidor />
      </CiudadCineProvider>,
    );

    expect(await screen.findByText('Córdoba')).toBeInTheDocument();
  });

  it('no preselecciona una ciudad cuando no hay selección guardada', async () => {
    render(
      <CiudadCineProvider>
        <Consumidor />
      </CiudadCineProvider>,
    );

    expect(await screen.findByText('Sin ciudad')).toBeInTheDocument();
  });

  it('descarta y explica una selección guardada que perdió cobertura', async () => {
    window.sessionStorage.setItem('streamly.ciudadCine', ciudadSinCobertura.id);
    render(
      <CiudadCineProvider>
        <Consumidor />
      </CiudadCineProvider>,
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'La ciudad guardada ya no tiene cobertura verificada.',
    );
    expect(window.sessionStorage.getItem('streamly.ciudadCine')).toBeNull();
  });
  it('explica la retirada de una ciudad guardada aunque el directorio ya no la incluya', async () => {
    window.sessionStorage.setItem('streamly.ciudadCine', ciudadSinCobertura.id);
    fetch.mockResolvedValue(respuestaCiudades([ciudadDisponible]));
    render(
      <CiudadCineProvider>
        <Consumidor />
      </CiudadCineProvider>,
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'La ciudad guardada ya no tiene cobertura verificada. Elegí otra ciudad.',
    );
    expect(screen.getByText('Sin ciudad')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('streamly.ciudadCine')).toBeNull();
  });
  it('explica la pérdida de cobertura y el fallo al quitar la selección del almacenamiento', async () => {
    window.sessionStorage.setItem('streamly.ciudadCine', ciudadSinCobertura.id);
    fetch.mockResolvedValue(respuestaCiudades([]));
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage bloqueado');
    });
    render(
      <CiudadCineProvider>
        <Consumidor />
      </CiudadCineProvider>,
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'La ciudad guardada ya no tiene cobertura verificada.',
    );
    expect(screen.getByRole('status')).toHaveTextContent('No pudimos guardar la selección');
    expect(screen.getByText('Sin ciudad')).toBeInTheDocument();
  });

  it('mantiene la selección en memoria si sessionStorage no está disponible', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('Storage bloqueado');
    });
    render(
      <CiudadCineProvider>
        <Consumidor />
      </CiudadCineProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Elegir Córdoba' }));

    await waitFor(() => expect(screen.getByText('Córdoba')).toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('No pudimos guardar la selección');
  });
});
