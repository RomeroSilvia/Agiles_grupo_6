import { Link } from 'react-router';
import { buttonClassName } from './buttonClassName.js';

export function ButtonLink({ variant, size, fullWidth, className, ...props }) {
  return <Link className={buttonClassName({ variant, size, fullWidth, className })} {...props} />;
}
