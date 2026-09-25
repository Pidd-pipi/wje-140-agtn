export function toMonthKey(value?: string | null, now: Date = new Date()): string {
  if (value) {
    const match = /^(\d{4})-(\d{2})/.exec(value.trim());
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  }
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

export function nowDateTime(now: Date = new Date()): string {
  return now.toISOString().replace('T', ' ').slice(0, 16);
}

export function isValidDateTime(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(value.trim());
}

export function normalizeDateTime(value: string): string {
  return value.trim().replace('T', ' ');
}
