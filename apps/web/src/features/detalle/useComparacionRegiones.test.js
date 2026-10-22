import { afterEach, describe, expect, it, vi } from 'vitest';
import { TIPO_OFERTA } from '@buscador/shared/constants';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useComparacionRegiones } from './useComparacionRegiones.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useComparacionRegiones', () => {
  it('compara la disponibilidad en las regiones seleccionadas', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          regiones: [
            {
              region: 'US',
              ofertas: [
                {
                  tipoOferta: TIPO_OFERTA.SUSCRIPCION,
                  plataformas: [{ id: 1, tmdbProviderId: 8, nombre: 'Netflix' }],
                },
              ],
              enlaceTmdb: null,
            },
          ],
          regionesFallidas: ['BR'],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useComparacionRegiones({ tipo: 'pelicula', tmdbId: 1 }));

    await act(async () => {
      await result.current.comparar(['US', 'BR']);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.consultado).toBe(true);
    expect(result.current.regiones).toHaveLength(1);
    expect(result.current.regionesFallidas).toEqual(['BR']);
    expect(fetchMock.mock.calls[0][0].toString()).toContain(
      '/api/titulos/pelicula/1/disponibilidad/comparacion?regiones=US%2CBR',
    );
  });

  it('valida las regiones antes de consultar la API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useComparacionRegiones({ tipo: 'pelicula', tmdbId: 1 }));

    await act(async () => {
      await result.current.comparar([]);
    });

    expect(result.current.error).toBe('Seleccioná al menos una región para comparar');
    expect(fetchMock).not.toHaveBeenCalled();
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
              error: { code: 'EXTERNAL_SERVICE', message: 'Error al comparar' },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              regiones: [{ region: 'US', ofertas: [], enlaceTmdb: null }],
              regionesFallidas: [],
            },
          }),
        });
      }),
    );

    const { result } = renderHook(() => useComparacionRegiones({ tipo: 'pelicula', tmdbId: 1 }));

    await act(async () => {
      await result.current.comparar(['US']);
    });

    expect(result.current.error).toBe('Error al comparar');

    await act(async () => {
      result.current.reintentar();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
    expect(result.current.regiones).toEqual([{ region: 'US', ofertas: [], enlaceTmdb: null }]);
  });
});
