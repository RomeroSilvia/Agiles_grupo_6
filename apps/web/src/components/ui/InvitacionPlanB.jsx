import logoPlanB from '../../assets/logo-plan-b.png';
import logoStreamly from '../../assets/logo-s.svg';
import { ExternalLink } from './ExternalLink.jsx';
import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

export function InvitacionPlanB() {
  return (
    <ExternalLink
      href="https://plan-b-dusky.vercel.app/"
      aria-label="Los planes que te ofrecemos en Streamly disfrutálos mejor con amigos: ir a Plan B (se abre en una pestaña nueva)"
      className={`flex flex-wrap items-center justify-between gap-4 rounded-card bg-panel px-5 py-3 text-panel-foreground transition-colors hover:bg-panel/90 sm:px-6 ${FOCUS_RING_CLASS_NAME}`}
    >
      <span className="min-w-0 flex-1 font-display text-lg font-bold sm:text-xl">
        Los planes que te ofrecemos en{' '}
        <span className="whitespace-nowrap">
          <span className="sr-only">S</span>
          <img
            src={logoStreamly}
            alt=""
            className="mr-0.5 inline-block h-5 w-auto align-text-bottom"
          />
          <span>treamly</span>
        </span>{' '}
        disfrutálos mejor con amigos:
      </span>
      <img
        src={logoPlanB}
        alt="Plan B"
        width="291"
        height="195"
        className="h-auto w-20 shrink-0 sm:w-24"
      />
    </ExternalLink>
  );
}
