import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { obtenerExhibicionPelicula } from './cartelera.api.js';
import { useExhibicionCine } from './useExhibicionCine.js';
vi.mock('./cartelera.api.js', () => ({ obtenerExhibicionPelicula: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
describe('exhibición de la sección de funciones', () => {
  it.each([true, false])(
    'muestra la sección solo si el servidor confirma exhibición: %s',
    async (consultable) => {
      obtenerExhibicionPelicula.mockResolvedValue({ consultable });
      const { result } = renderHook(() => useExhibicionCine({ tipo: 'pelicula', tmdbId: '77' }));
      expect(result.current).toMatchObject({ loading: true, consultable: null, error: '' });
      await waitFor(() => expect(obtenerExhibicionPelicula).toHaveBeenCalledOnce());
      await act(async () => {});
      expect(result.current).toMatchObject({ loading: false, consultable, error: '' });
    },
  );
  it('no consulta series y distingue una falla o contrato inválido de una confirmación negativa', async () => {
    const { result, rerender } = renderHook((props) => useExhibicionCine(props), {
      initialProps: { tipo: 'serie', tmdbId: '77' },
    });
    expect(obtenerExhibicionPelicula).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ loading: false, consultable: null, error: '' });
    obtenerExhibicionPelicula.mockRejectedValueOnce(new Error('Fuente caída'));
    rerender({ tipo: 'pelicula', tmdbId: '77' });
    await act(async () => {});
    expect(result.current).toMatchObject({
      loading: false,
      consultable: null,
      error: expect.stringContaining('No pudimos verificar'),
    });
    obtenerExhibicionPelicula.mockResolvedValueOnce({ consultable: 'si' });
    rerender({ tipo: 'pelicula', tmdbId: '78' });
    await act(async () => {});
    expect(result.current).toMatchObject({
      loading: false,
      consultable: null,
      error: expect.stringContaining('No pudimos verificar'),
    });
  });
  it('permite reintentar una falla sin confirmar ausencia de exhibición', async () => {
    obtenerExhibicionPelicula
      .mockRejectedValueOnce(new Error('Fuente caída'))
      .mockResolvedValueOnce({ consultable: true });
    const { result } = renderHook(() => useExhibicionCine({ tipo: 'pelicula', tmdbId: '77' }));
    await waitFor(() => expect(result.current.error).toMatch(/No pudimos verificar/));
    act(() => result.current.reintentar());
    expect(result.current).toMatchObject({ loading: true, consultable: null, error: '' });
    await waitFor(() => expect(result.current.consultable).toBe(true));
    expect(result.current).toMatchObject({ loading: false, error: '' });
    expect(obtenerExhibicionPelicula).toHaveBeenCalledTimes(2);
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
    expect(result.current).toMatchObject({ consultable: false, loading: false, error: '' });
  });
});
