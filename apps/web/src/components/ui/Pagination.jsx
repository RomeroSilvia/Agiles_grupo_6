import { Button } from './Button.jsx';
import { ArrowLeftIcon, ArrowRightIcon } from './icons.jsx';

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  label = 'Paginación',
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3">
      <Button
        variant="secondary"
        size="sm"
        fullWidth={false}
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ArrowLeftIcon className="size-4" />
        Anterior
      </Button>
      <p className="text-sm text-muted">
        Página {page} de {totalPages}
      </p>
      <Button
        variant="secondary"
        size="sm"
        fullWidth={false}
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
        <ArrowRightIcon className="size-4" />
      </Button>
    </nav>
  );
}
