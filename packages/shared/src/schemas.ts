import { z } from "zod";
import { CategoryType, IncomeStatus, OperationKind, PaymentStatus, PlannedOperationStatus } from "./enums";

export const moneySchema = z.union([z.string(), z.number()]).transform(String);
export const isoDateSchema = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export const telegramAuthSchema = z.object({
  initData: z.string().min(1)
});

export const accountInputSchema = z.object({
  name: z.string().min(1),
  balance: moneySchema
});

export const debtInputSchema = z.object({
  name: z.string().min(1),
  amount: moneySchema
});

export const categoryInputSchema = z.object({
  name: z.string().min(1).max(40),
  type: z.nativeEnum(CategoryType).default(CategoryType.expense),
  color: z.string().min(1).max(24).default("#5b8cff"),
  icon: z.string().min(1).max(40).default("tag"),
  isDefault: z.boolean().default(false)
});

const categoryIdSchema = z.string().min(1).nullish();

export const incomeInputSchema = z.object({
  name: z.string().min(1),
  amount: moneySchema,
  plannedDate: isoDateSchema,
  expectedDate: isoDateSchema.nullish(),
  actualDate: isoDateSchema.nullish(),
  status: z.nativeEnum(IncomeStatus).default(IncomeStatus.planned),
  note: z.string().nullish(),
  categoryId: categoryIdSchema
});

export const paymentInputSchema = z.object({
  name: z.string().min(1),
  amount: moneySchema,
  plannedDate: isoDateSchema,
  expectedDate: isoDateSchema.nullish(),
  actualDate: isoDateSchema.nullish(),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.planned),
  note: z.string().nullish(),
  categoryId: categoryIdSchema
});

export const operationEntryInputSchema = z.object({
  targetType: z.enum(["account", "debt"]),
  targetId: z.string().min(1),
  amount: moneySchema
});

export const operationInputSchema = z.object({
  kind: z.nativeEnum(OperationKind),
  name: z.string().min(1),
  amount: moneySchema,
  operationDate: isoDateSchema,
  note: z.string().nullish(),
  plannedOperationId: z.string().nullish(),
  seriesId: z.string().nullish(),
  categoryId: categoryIdSchema,
  entries: z.array(operationEntryInputSchema).default([])
});

export const plannedOperationInputSchema = z.object({
  kind: z.nativeEnum(OperationKind),
  name: z.string().min(1),
  amount: moneySchema,
  plannedDate: isoDateSchema,
  expectedDate: isoDateSchema.nullish(),
  actualDate: isoDateSchema.nullish(),
  status: z.nativeEnum(PlannedOperationStatus).default(PlannedOperationStatus.planned),
  note: z.string().nullish(),
  sourceAccountId: z.string().nullish(),
  targetAccountId: z.string().nullish(),
  targetDebtId: z.string().nullish(),
  seriesId: z.string().nullish(),
  categoryId: categoryIdSchema
});

export const plannedOperationSeriesInputSchema = z.object({
  kind: z.nativeEnum(OperationKind),
  name: z.string().min(1),
  amount: moneySchema,
  startDate: isoDateSchema,
  count: z.number().int().min(1).max(120),
  finalAmount: moneySchema.nullish(),
  note: z.string().nullish(),
  sourceAccountId: z.string().nullish(),
  targetAccountId: z.string().nullish(),
  targetDebtId: z.string().nullish(),
  categoryId: categoryIdSchema
});

export const markDoneSchema = z.object({
  actualDate: isoDateSchema.optional()
});

export const reconcileSchema = z.object({
  accounts: z.array(z.object({ id: z.string(), balance: moneySchema })),
  debts: z.array(z.object({ id: z.string(), amount: moneySchema })),
  editedBalance: moneySchema.nullish()
});

export const settingsStartBalanceSchema = z.object({
  startBalance: moneySchema,
  currentMonth: z.string().optional()
});

export const settingsEditedBalanceSchema = z.object({
  editedBalance: moneySchema.nullable()
});
