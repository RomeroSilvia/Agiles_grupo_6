import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SeccionExhibicionCine } from './SeccionExhibicionCine.jsx';

vi.mock('./SeccionFunciones.jsx', () => ({
  SeccionFunciones: () => <p>Selector de ciudad y funciones</p>,
}));
afterEach(() => vi.unstubAllGlobals());
const response = (data) => ({ ok: true, json: async () => ({ data }) });

describe('sección de exhibición en cines', () => {
  it('mantiene el título, informa un 502 y permite recuperar la sección con un reintento', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({ error: { code: 'EXTERNAL_SERVICE', message: 'Fuente caída' } }),
      })
      .mockResolvedValueOnce(response({ consultable: true }));
    vi.stubGlobal('fetch', fetchMock);
    render(<SeccionExhibicionCine tipo="pelicula" tmdbId="77" />);
    expect(screen.getByRole('heading', { name: 'Cines y funciones' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Verificando exhibición');
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos verificar');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar exhibición' }));
    expect(await screen.findByText('Selector de ciudad y funciones')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('oculta la sección únicamente después de una confirmación negativa', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ consultable: false })));
    render(<SeccionExhibicionCine tipo="pelicula" tmdbId="77" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Cines y funciones' })).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('no ofrece funciones ni consulta exhibición para series', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<SeccionExhibicionCine tipo="serie" tmdbId="77" />);
    expect(screen.queryByRole('heading', { name: 'Cines y funciones' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
