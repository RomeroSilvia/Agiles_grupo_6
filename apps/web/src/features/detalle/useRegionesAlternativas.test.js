import { afterEach, describe, expect, it, vi } from 'vitest';
import { TIPO_OFERTA } from '@buscador/shared/constants';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useRegionesAlternativas } from './useRegionesAlternativas.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useRegionesAlternativas', () => {
  it('obtiene las regiones alternativas cuando está activo', async () => {
    const alternativasMock = [
      {
        region: 'US',
        ofertas: [
          {
            tipoOferta: TIPO_OFERTA.SUSCRIPCION,
            plataformas: [{ id: 3, tmdbProviderId: 337, nombre: 'Disney Plus' }],
          },
        ],
        enlaceTmdb: null,
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            region: 'AR',
            disponibleEnRegionActual: false,
            alternativas: alternativasMock,
          },
        }),
      }),
    );

    const { result } = renderHook(() =>
      useRegionesAlternativas({ tipo: 'pelicula', tmdbId: 1, region: 'AR', activo: true }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.alternativas).toEqual(alternativasMock);
    expect(result.current.error).toBeNull();
  });

  it('no consulta la API cuando no está activo', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useRegionesAlternativas({ tipo: 'pelicula', tmdbId: 1, region: 'AR', activo: false }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.alternativas).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maneja errores y permite reintentar', async () => {
    let intentos = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        intentos += 1;
        if (intentos === 1) {
          return Promise.resolve({
            ok: false,
            json: async () => ({
              error: {
                code: 'EXTERNAL_SERVICE',
                message: 'No se pudo consultar regiones alternativas',
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              region: 'AR',
              disponibleEnRegionActual: false,
              alternativas: [],
            },
          }),
        });
      }),
    );

    const { result } = renderHook(() =>
      useRegionesAlternativas({ tipo: 'pelicula', tmdbId: 1, region: 'AR', activo: true }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe('No se pudo consultar regiones alternativas');
    });

    act(() => {
      result.current.reintentar();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toBeNull();
  });
});
