export function getUtcDayWindow(date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function parseYear(date) {
  const year = typeof date === 'string' ? date.slice(0, 4) : null;
  return /^\d{4}$/.test(year ?? '') ? Number(year) : null;
}
