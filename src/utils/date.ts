export function nowIso(): string {
  return new Date().toISOString();
}

export function toIsoString(value: Date | number | string): string {
  return new Date(value).toISOString();
}
