const SIZES = {
  section: 'text-xl font-semibold',
  card: 'text-base font-semibold',
  sub: 'text-sm font-medium',
};

export function SectionTitle({
  as: Elemento = 'h2',
  size = 'section',
  className = '',
  children,
  ...props
}) {
  return (
    <Elemento {...props} className={`font-sans ${SIZES[size]} ${className}`}>
      {children}
    </Elemento>
  );
}
