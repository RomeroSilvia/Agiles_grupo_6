import { Link } from 'react-router';
import { buttonClassName } from './buttonClassName.js';

export function ButtonLink({ variant, fullWidth, className, ...props }) {
  return <Link className={buttonClassName({ variant, fullWidth, className })} {...props} />;
}
