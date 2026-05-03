export const IncomeStatus = {
  planned: "planned",
  delayed: "delayed",
  received_on_time: "received_on_time",
  received_late: "received_late",
  cancelled: "cancelled"
} as const;

export const PaymentStatus = {
  planned: "planned",
  overdue: "overdue",
  paid_on_time: "paid_on_time",
  paid_late: "paid_late",
  skipped: "skipped",
  cancelled: "cancelled"
} as const;

export type IncomeStatus = (typeof IncomeStatus)[keyof typeof IncomeStatus];
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
