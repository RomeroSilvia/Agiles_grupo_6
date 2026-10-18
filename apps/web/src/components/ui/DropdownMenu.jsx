import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useDismiss } from '../../hooks/useDismiss.js';
import { FOCUS_RING_CLASS_NAME } from './focusRing.js';
import { CARD_CLASS_NAME } from './surface.js';

function menuItems(menu) {
  return menu ? [...menu.querySelectorAll('[role="menuitem"]')] : [];
}

export function DropdownMenu({ label, trigger, children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const close = useCallback(({ reason } = {}) => {
    setOpen(false);
    if (reason === 'escape') {
      triggerRef.current?.focus();
    }
  }, []);

  useDismiss(containerRef, open, close);

  useEffect(() => {
    if (open) {
      menuItems(menuRef.current)[0]?.focus();
    }
  }, [open]);

  function handleKeyDown(event) {
    const items = menuItems(menuRef.current);
    const current = items.indexOf(document.activeElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(current + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((actual) => !actual)}
        className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-full ${FOCUS_RING_CLASS_NAME}`}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleKeyDown}
          onClick={() => close()}
          className={`absolute right-0 z-20 mt-2 min-w-48 p-1.5 shadow-lg ${CARD_CLASS_NAME}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
