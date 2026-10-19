import { useEffect } from 'react';

export function useDismiss(ref, active, onDismiss) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onDismiss({ reason: 'outside' });
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onDismiss({ reason: 'escape' });
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, active, onDismiss]);
}
