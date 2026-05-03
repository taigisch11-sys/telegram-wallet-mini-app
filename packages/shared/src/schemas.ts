import { z } from "zod";
import { IncomeStatus, PaymentStatus } from "./enums";

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

export const incomeInputSchema = z.object({
  name: z.string().min(1),
  amount: moneySchema,
  plannedDate: isoDateSchema,
  expectedDate: isoDateSchema.nullish(),
  actualDate: isoDateSchema.nullish(),
  status: z.nativeEnum(IncomeStatus).default(IncomeStatus.planned),
  note: z.string().nullish()
});

export const paymentInputSchema = z.object({
  name: z.string().min(1),
  amount: moneySchema,
  plannedDate: isoDateSchema,
  expectedDate: isoDateSchema.nullish(),
  actualDate: isoDateSchema.nullish(),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.planned),
  note: z.string().nullish()
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
