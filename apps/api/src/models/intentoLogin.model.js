export const INTENTO_LOGIN_COLUMNS = 'bloqueado_hasta';

export function fromRow(row) {
  return { bloqueadoHasta: row.bloqueado_hasta ? new Date(row.bloqueado_hasta) : null };
}
