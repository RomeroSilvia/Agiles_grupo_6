import { AlertIcon } from './icons.jsx';
import { TextButton } from './TextButton.jsx';

const TONES = {
  danger: 'border-danger/30 bg-danger-surface text-danger',
  info: 'border-border bg-surface text-muted',
};

export function Alert({
  tone = 'danger',
  onRetry,
  retryLabel = 'Reintentar',
  retryDisabled = false,
  className = '',
  children,
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`flex flex-col gap-2 rounded-field border p-3 text-sm font-medium sm:flex-row sm:items-start sm:justify-between ${TONES[tone]} ${className}`}
    >
      <div className="flex items-start gap-2">
        <AlertIcon className="mt-0.5 size-4 shrink-0" />
        <div>{children}</div>
      </div>
      {onRetry && (
        <TextButton onClick={onRetry} disabled={retryDisabled} className="shrink-0 self-start">
          {retryLabel}
        </TextButton>
      )}
    </div>
  );
}
