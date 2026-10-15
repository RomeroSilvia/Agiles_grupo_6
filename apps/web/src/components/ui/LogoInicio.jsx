import { Link } from 'react-router';
import { APP_NAME } from '../../config/app.config.js';
import { Logo } from './Logo.jsx';

export function LogoInicio({ className = '' }) {
  return (
    <Link
      to="/"
      aria-label={`${APP_NAME}, ir al inicio`}
      className={`inline-flex shrink-0 items-center rounded-sm ${className}`}
    >
      <Logo />
    </Link>
  );
}
