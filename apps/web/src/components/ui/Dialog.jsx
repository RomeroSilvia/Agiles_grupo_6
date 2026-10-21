import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDismiss } from '../../hooks/useDismiss.js';
import { IconBadge } from './IconBadge.jsx';
import { CARD_CLASS_NAME } from './surface.js';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableElements(panel) {
  return panel ? [...panel.querySelectorAll(FOCUSABLE_SELECTOR)] : [];
}

export function Dialog({ open, onClose, title, icon, tone, children }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useDismiss(panelRef, open, onClose);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previousFocus = document.activeElement;
    const panel = panelRef.current;
    (panel.querySelector('input') ?? focusableElements(panel)[0] ?? panel).focus();
    return () => previousFocus?.focus?.();
  }, [open]);

  if (!open) {
    return null;
  }

  function handleKeyDown(event) {
    if (event.key !== 'Tab') {
      return;
    }
    const items = focusableElements(panelRef.current);
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-panel/60 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto p-6 shadow-xl ${CARD_CLASS_NAME}`}
      >
        {icon && <IconBadge icon={icon} tone={tone} />}
        <h2 id={titleId} className="mt-4 text-2xl font-extrabold tracking-tight">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
