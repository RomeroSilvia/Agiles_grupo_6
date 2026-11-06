const SHAPES = {
  line: 'rounded-md',
  block: 'rounded-card',
  pill: 'rounded-full',
  fill: '',
};

export function Skeleton({ shape = 'line', className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse bg-skeleton motion-reduce:animate-none ${SHAPES[shape]} ${className}`}
    />
  );
}
