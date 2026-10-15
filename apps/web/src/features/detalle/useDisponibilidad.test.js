import { describe, it, expect, afterEach, vi } from 'vitest';
import { TIPO_OFERTA } from '@buscador/shared/constants';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDisponibilidad } from './useDisponibilidad.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useDisponibilidad', () => {
  it('obtiene las plataformas disponibles para un título', async () => {
    const plataformasMock = [
      { id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: '/netflix.jpg' },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            region: 'AR',
            ofertas: [{ tipoOferta: TIPO_OFERTA.SUSCRIPCION, plataformas: plataformasMock }],
            enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch',
          },
        }),
      }),
    );

    const { result } = renderHook(() =>
      useDisponibilidad({ tipo: 'pelicula', tmdbId: 1, region: 'AR' }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.ofertas).toEqual([
      { tipoOferta: TIPO_OFERTA.SUSCRIPCION, plataformas: plataformasMock },
    ]);
    expect(result.current.enlaceTmdb).toBe('https://www.themoviedb.org/movie/1/watch');
    expect(result.current.error).toBeNull();
  });

  it('maneja errores de la API y permite reintentar', async () => {
    let llamadas = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        llamadas += 1;
        if (llamadas === 1) {
          return Promise.resolve({
            ok: false,
            json: async () => ({
              error: { code: 'EXTERNAL_SERVICE', message: 'Servicio no disponible' },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              region: 'AR',
              ofertas: [
                {
                  tipoOferta: TIPO_OFERTA.SUSCRIPCION,
                  plataformas: [{ id: 1, tmdbProviderId: 8, nombre: 'Netflix' }],
                },
              ],
              enlaceTmdb: null,
            },
          }),
        });
      }),
    );

    const { result } = renderHook(() =>
      useDisponibilidad({ tipo: 'serie', tmdbId: 2, region: 'AR' }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Servicio no disponible');
    });
    expect(result.current.ofertas).toEqual([]);

    act(() => {
      result.current.reintentar();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.ofertas).toHaveLength(1);
  });

  it('no ejecuta la consulta si faltan parámetros requeridos', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDisponibilidad({}));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('No se pudo identificar el título.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
