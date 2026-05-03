export function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function toMoney(value: unknown) {
  return Number(value ?? 0).toFixed(2);
}

export function toDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date;
}

export function iso(value: string | Date | null | undefined) {
  return toDate(value)?.toISOString() ?? null;
}

export function effectiveDate<T extends { expectedDate: Date | null; plannedDate: Date }>(item: T) {
  return item.expectedDate ?? item.plannedDate;
}
