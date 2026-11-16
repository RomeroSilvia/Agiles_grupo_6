import { describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '../services/api.service.js';
import { useRemoteData } from './useRemoteData.js';

function renderUseRemoteData(props) {
  return renderHook((actuales) => useRemoteData(actuales), {
    initialProps: { mensajeError: 'Falló', habilitado: true, ...props },
  });
}

describe('useRemoteData', () => {
  it('pide los datos y los devuelve', async () => {
    const solicitar = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderUseRemoteData({ clave: 'a', solicitar });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.cargado).toBe(true));
    expect(result.current.datos).toEqual({ id: 1 });
    expect(solicitar).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
  });

  it('no pide nada si no está habilitado', () => {
    const solicitar = vi.fn();
    const { result } = renderUseRemoteData({ clave: 'a', solicitar, habilitado: false });

    expect(solicitar).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('usa el mensaje y el código de la API, o el mensaje propio si el error es otro', async () => {
    const solicitar = vi
      .fn()
      .mockRejectedValueOnce(new ApiError({ status: 404, code: 'NOT_FOUND', message: 'No está' }))
      .mockRejectedValueOnce(new Error('interno'));
    const { result } = renderUseRemoteData({ clave: 'a', solicitar });

    await waitFor(() => expect(result.current.error).toBe('No está'));
    expect(result.current.codigoError).toBe('NOT_FOUND');

    act(() => result.current.reintentar());

    await waitFor(() => expect(result.current.error).toBe('Falló'));
    expect(result.current.codigoError).toBeNull();
  });

  it('aborta el pedido anterior y descarta su respuesta al cambiar la clave', async () => {
    let resolverPrimero;
    const solicitar = vi
      .fn()
      .mockImplementationOnce(() => new Promise((resolver) => (resolverPrimero = resolver)))
      .mockResolvedValueOnce('segundo');
    const { result, rerender } = renderUseRemoteData({ clave: 'a', solicitar });
    const [{ signal }] = solicitar.mock.calls[0];

    rerender({ clave: 'b', solicitar, habilitado: true, mensajeError: 'Falló' });
    await act(async () => resolverPrimero('primero'));

    expect(signal.aborted).toBe(true);
    await waitFor(() => expect(result.current.datos).toBe('segundo'));
  });
});
