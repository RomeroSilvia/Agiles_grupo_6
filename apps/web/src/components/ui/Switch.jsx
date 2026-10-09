import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

export function Switch({ id, checked, onChange, label, disabled = false }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`inline-flex h-6.5 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.75 transition-colors duration-150 ${FOCUS_RING_CLASS_NAME} aria-disabled:cursor-not-allowed aria-disabled:opacity-60 ${checked ? 'bg-primary' : 'bg-border'}`}
    >
      <span
        aria-hidden="true"
        className={`size-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? 'translate-x-4.5' : 'translate-x-0'}`}
      />
    </button>
  );
}
