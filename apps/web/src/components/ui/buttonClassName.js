import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  accent: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'border border-border-strong bg-surface text-foreground hover:bg-border/60',
  danger: 'bg-danger text-danger-foreground hover:bg-danger/90',
  dangerOutline: 'border border-danger bg-transparent text-danger hover:bg-danger/10',
};

export function buttonClassName({ variant = 'primary', fullWidth = true, className = '' } = {}) {
  return `inline-flex min-h-12 ${fullWidth ? 'w-full' : 'w-auto'} cursor-pointer items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors duration-150 ${FOCUS_RING_CLASS_NAME} active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`;
}
