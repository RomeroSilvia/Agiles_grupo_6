import logoPlanB from '../../assets/logo-plan-b.png';
import logoStreamly from '../../assets/logo-s.svg';
import { ExternalLink } from '../../components/ui/ExternalLink.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { PLAN_B_URL } from '../../config/app.config.js';

export function InvitacionPlanB() {
  return (
    <ExternalLink
      href={PLAN_B_URL}
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
        disfrutalos mejor con amigos:
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
