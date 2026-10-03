export function IconButton({ className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-border/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
