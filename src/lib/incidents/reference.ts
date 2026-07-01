export function newClientGeneratedId(): string {
  return crypto.randomUUID();
}

export function combineDateAndTime(date: string | null, time: string | null): string | null {
  if (!date || !time) return null;
  const local = new Date(`${date}T${time}:00`);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

export function calcDurationMinutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return null;
  return Math.round((endMs - startMs) / 60000);
}
