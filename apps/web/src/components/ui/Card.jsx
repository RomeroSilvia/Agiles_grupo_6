import { cardClassName } from './surface.js';

export function Card({
  as: Elemento = 'div',
  tone,
  padding,
  elevated,
  className,
  children,
  ...props
}) {
  return (
    <Elemento className={cardClassName({ tone, padding, elevated, className })} {...props}>
      {children}
    </Elemento>
  );
}
