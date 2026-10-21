import { CheckIcon } from './icons.jsx';

export function SuccessMessage({ children }) {
  return (
    <p role="status" className="flex items-start gap-2 text-sm font-medium text-success">
      <CheckIcon className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}
