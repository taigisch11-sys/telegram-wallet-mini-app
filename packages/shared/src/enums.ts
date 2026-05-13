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

export const OperationKind = {
  income: "income",
  expense: "expense",
  transfer: "transfer",
  debt_repayment: "debt_repayment",
  adjustment: "adjustment",
  unallocated: "unallocated"
} as const;

export const PlannedOperationStatus = {
  planned: "planned",
  overdue: "overdue",
  done: "done",
  skipped: "skipped",
  cancelled: "cancelled"
} as const;

export const CategoryType = {
  income: "income",
  expense: "expense",
  transfer: "transfer",
  debt: "debt"
} as const;

export type IncomeStatus = (typeof IncomeStatus)[keyof typeof IncomeStatus];
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export type OperationKind = (typeof OperationKind)[keyof typeof OperationKind];
export type PlannedOperationStatus = (typeof PlannedOperationStatus)[keyof typeof PlannedOperationStatus];
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];
