export function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function toMoney(value: unknown) {
  return toNumber(value).toFixed(2);
}

export function normalizeDebtAmount(value: string | number) {
  const amount = Number(value);
  return amount > 0 ? -amount : amount;
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function effectiveDate(item: { expectedDate: Date | string | null; plannedDate: Date | string }) {
  return new Date(item.expectedDate ?? item.plannedDate);
}
