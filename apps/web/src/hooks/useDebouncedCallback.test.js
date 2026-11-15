import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDebouncedCallback } from './useDebouncedCallback.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedCallback', () => {
  it('llama una sola vez, con el último valor, cuando pasa la espera', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('a');
    result.current('an');
    vi.advanceTimersByTime(299);
    result.current('ana');
    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback.mock.calls).toEqual([['ana']]);
  });

  it('no llama si el componente se desmonta antes de la espera', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300));

    result.current('ana');
    unmount();
    vi.advanceTimersByTime(300);

    expect(callback).not.toHaveBeenCalled();
  });
});
