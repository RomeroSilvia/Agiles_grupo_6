import { useCallback, useId, useRef, useState } from 'react';
import { useDismiss } from '../../hooks/useDismiss.js';
import { FOCUS_RING_CLASS_NAME } from './focusRing.js';
import { CARD_CLASS_NAME } from './surface.js';

export function Popover({ label, trigger, triggerClassName = '', panelClassName = '', children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  const close = useCallback(({ reason } = {}) => {
    setOpen(false);
    if (reason === 'escape') {
      triggerRef.current?.focus();
    }
  }, []);

  useDismiss(containerRef, open, close);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((actual) => !actual)}
        className={`cursor-pointer ${FOCUS_RING_CLASS_NAME} ${triggerClassName}`}
      >
        {trigger}
      </button>
      <div
        id={panelId}
        role="group"
        aria-label={label}
        hidden={!open}
        className={`absolute left-0 z-20 mt-2 p-2 shadow-lg ${CARD_CLASS_NAME} ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
