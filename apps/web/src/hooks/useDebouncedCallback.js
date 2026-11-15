import { useCallback, useEffect, useRef } from 'react';

// Devuelve una función que llama a callback recién cuando pasan esperaMs sin nuevas llamadas
export function useDebouncedCallback(callback, esperaMs) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef(undefined);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  return useCallback(
    (...args) => {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => callbackRef.current(...args), esperaMs);
    },
    [esperaMs],
  );
}
