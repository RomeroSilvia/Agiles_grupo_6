import { useCallback, useId, useRef, useState } from 'react';
import { useDismiss } from '../../hooks/useDismiss.js';
import { FOCUS_RING_CLASS_NAME } from './focusRing.js';
import { CARD_CLASS_NAME } from './surface.js';

const ANCHORS = {
  trigger: 'relative',
  parent: '',
};

export function Popover({
  label,
  trigger,
  open: controlledOpen,
  onOpenChange,
  anchor = 'trigger',
  triggerClassName = '',
  panelClassName = '',
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  const changeOpen = useCallback(
    (next) => {
      if (!controlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  const close = useCallback(
    ({ reason } = {}) => {
      changeOpen(false);
      if (reason === 'escape') {
        triggerRef.current?.focus();
      }
    },
    [changeOpen],
  );

  useDismiss(containerRef, open, close);

  return (
    <div ref={containerRef} className={ANCHORS[anchor]}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => changeOpen(!open)}
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
