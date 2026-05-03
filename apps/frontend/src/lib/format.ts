export function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(amount);
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(value));
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    planned: "План",
    delayed: "Задержка",
    received_on_time: "Получено",
    received_late: "Получено поздно",
    cancelled: "Отменено",
    overdue: "Просрочено",
    paid_on_time: "Оплачено",
    paid_late: "Оплачено поздно",
    skipped: "Пропущено"
  };
  return labels[status] ?? status;
}
