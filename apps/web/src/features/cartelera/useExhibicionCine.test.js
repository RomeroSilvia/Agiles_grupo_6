import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { obtenerExhibicionPelicula } from './cartelera.api.js';
import { useExhibicionCine } from './useExhibicionCine.js';
vi.mock('./cartelera.api.js', () => ({ obtenerExhibicionPelicula: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
describe('exhibición de la sección de funciones', () => {
  it.each([true, false])(
    'muestra la sección solo si el servidor confirma exhibición: %s',
    async (consultable) => {
      obtenerExhibicionPelicula.mockResolvedValue({ consultable });
      const { result } = renderHook(() => useExhibicionCine({ tipo: 'pelicula', tmdbId: '77' }));
      expect(result.current).toBeFalsy();
      await waitFor(() => expect(obtenerExhibicionPelicula).toHaveBeenCalledOnce());
      await act(async () => {});
      expect(Boolean(result.current)).toBe(consultable);
    },
  );
  it('no consulta series y oculta la sección ante una falla o contrato inválido', async () => {
    const { result, rerender } = renderHook((props) => useExhibicionCine(props), {
      initialProps: { tipo: 'serie', tmdbId: '77' },
    });
    expect(obtenerExhibicionPelicula).not.toHaveBeenCalled();
    obtenerExhibicionPelicula.mockRejectedValueOnce(new Error('Fuente caída'));
    rerender({ tipo: 'pelicula', tmdbId: '77' });
    await act(async () => {});
    expect(result.current).toBe(false);
    obtenerExhibicionPelicula.mockResolvedValueOnce({ consultable: 'si' });
    rerender({ tipo: 'pelicula', tmdbId: '78' });
    await act(async () => {});
    expect(result.current).toBe(false);
  });
  it('aborta y descarta una confirmación tardía al cambiar de película', async () => {
    let resolver;
    obtenerExhibicionPelicula
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolver = resolve;
          }),
      )
      .mockResolvedValueOnce({ consultable: false });
    const { result, rerender } = renderHook(
      ({ tmdbId }) => useExhibicionCine({ tipo: 'pelicula', tmdbId }),
      { initialProps: { tmdbId: '77' } },
    );
    const signal = obtenerExhibicionPelicula.mock.calls[0][0].signal;
    rerender({ tmdbId: '78' });
    await act(async () => resolver({ consultable: true }));
    expect(signal.aborted).toBe(true);
    expect(result.current).toBe(false);
  });
});
