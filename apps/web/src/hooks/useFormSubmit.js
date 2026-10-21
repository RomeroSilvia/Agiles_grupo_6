import { useCallback, useState } from 'react';

export function useFormSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(async (action) => {
    setSubmitting(true);
    setError(null);
    try {
      return { ok: true, data: await action() };
    } catch (actionError) {
      setError(actionError);
      return { ok: false, error: actionError };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { submitting, error, submit, clearError };
}
