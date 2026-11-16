import { Button } from './Button.jsx';

export function LoadMoreButton({ onClick, disabled, loading, children = 'Cargar más', className }) {
  return (
    <div className={`flex justify-center ${className ?? ''}`}>
      <Button
        variant="outline"
        size="compact"
        fullWidth={false}
        onClick={onClick}
        disabled={disabled}
        loading={loading}
        loadingText="Cargando…"
      >
        {children}
      </Button>
    </div>
  );
}
