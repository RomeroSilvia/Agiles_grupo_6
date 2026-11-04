import { ChevronDownIcon } from './icons.jsx';
import { fieldClassName } from './fieldClassName.js';

export function Select({ children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${fieldClassName({ trailing: true })} cursor-pointer appearance-none`}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
