import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFormSubmit } from './useFormSubmit.js';

describe('useFormSubmit', () => {
  it('devuelve los datos de la acción y deja de enviar', async () => {
    const { result } = renderHook(() => useFormSubmit());

    let respuesta;
    await act(async () => {
      respuesta = await result.current.submit(async () => 'listo');
    });

    expect(respuesta).toEqual({ ok: true, data: 'listo' });
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('guarda el error de la acción y permite limpiarlo', async () => {
    const { result } = renderHook(() => useFormSubmit());
    const falla = new Error('No se pudo');

    let respuesta;
    await act(async () => {
      respuesta = await result.current.submit(async () => {
        throw falla;
      });
    });

    expect(respuesta).toEqual({ ok: false, error: falla });
    expect(result.current.error).toBe(falla);
    expect(result.current.submitting).toBe(false);

    act(() => result.current.clearError());

    expect(result.current.error).toBeNull();
  });
});
