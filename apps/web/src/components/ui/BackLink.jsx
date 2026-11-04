import { Link } from 'react-router';
import { ArrowLeftIcon } from './icons.jsx';
import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

export function BackLink({ children, ...props }) {
  return (
    <Link
      className={`inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-link hover:underline hover:underline-offset-4 ${FOCUS_RING_CLASS_NAME}`}
      {...props}
    >
      <ArrowLeftIcon className="size-4" />
      {children}
    </Link>
  );
}
