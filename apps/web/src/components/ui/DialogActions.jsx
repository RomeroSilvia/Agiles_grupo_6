import { Button } from './Button.jsx';

export function DialogActions({ onCancel, cancelDisabled, children }) {
  return (
    <div className="mt-6 flex gap-3">
      <Button
        variant="secondary"
        fullWidth={false}
        className="flex-1"
        onClick={onCancel}
        disabled={cancelDisabled}
      >
        Cancelar
      </Button>
      {children}
    </div>
  );
}
