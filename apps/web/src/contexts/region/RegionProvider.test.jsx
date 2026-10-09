import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { request } from '../../services/api.service.js';
import { SessionContext } from '../session/SessionContext.js';
import { useRegion } from './RegionContext.js';
import { RegionProvider } from './RegionProvider.jsx';

vi.mock('../../services/api.service.js', () => ({ request: vi.fn() }));

function EstadoRegion() {
  const { region, source, loading } = useRegion();
  return <p>{loading ? 'Detectando región' : `${region}: ${source}`}</p>;
}

function renderConSesion(user = null) {
  return render(
    <SessionContext.Provider value={{ user, loading: false }}>
      <RegionProvider>
        <EstadoRegion />
      </RegionProvider>
    </SessionContext.Provider>,
  );
}

beforeEach(() => vi.resetAllMocks());

describe('RegionProvider', () => {
  it('usa la región de la API y vuelve a consultar al iniciar sesión', async () => {
    request
      .mockResolvedValueOnce({ region: 'BR', source: 'ip' })
      .mockResolvedValueOnce({ region: 'UY', source: 'profile' });

    const view = renderConSesion();
    expect(await screen.findByText('BR: ip')).toBeInTheDocument();

    view.rerender(
      <SessionContext.Provider value={{ user: { id: 'usuario-1' }, loading: false }}>
        <RegionProvider>
          <EstadoRegion />
        </RegionProvider>
      </SessionContext.Provider>,
    );

    expect(await screen.findByText('UY: profile')).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenCalledWith('/region');
  });

  it('marca la región predeterminada si la consulta falla', async () => {
    request.mockRejectedValueOnce(new Error('Sin conexión'));

    renderConSesion();

    expect(await screen.findByText('AR: default')).toBeInTheDocument();
  });

  it('descarta una fuente desconocida del contrato de la API', async () => {
    request.mockResolvedValueOnce({ region: 'BR', source: 'desconocida' });

    renderConSesion();

    expect(await screen.findByText('AR: default')).toBeInTheDocument();
  });
});
