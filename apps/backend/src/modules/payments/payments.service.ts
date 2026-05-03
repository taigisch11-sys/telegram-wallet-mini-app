import { OperationKind, PaymentStatus } from "@wallet/shared";
import { notFound } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { mapPayment } from "../finance/finance-mappers";

export function resolvePaymentPaidStatus(effectiveDate: string | Date, actualDate: string | Date) {
  return new Date(actualDate) <= new Date(effectiveDate) ? PaymentStatus.paid_on_time : PaymentStatus.paid_late;
}

export async function listPayments(userId: string) {
  return (await prisma.payment.findMany({ where: { userId }, orderBy: { plannedDate: "asc" } })).map(mapPayment);
}

export async function createPayment(userId: string, data: any) {
  const payment = await prisma.payment.create({
    data: {
      userId,
      name: data.name,
      amount: data.amount,
      plannedDate: new Date(data.plannedDate),
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      actualDate: data.actualDate ? new Date(data.actualDate) : null,
      status: data.status,
      note: data.note ?? null
    }
  });
  await prisma.history.create({ data: { userId, type: "payment_created", payload: { name: data.name, amount: data.amount } } });
  return mapPayment(payment);
}

export async function updatePayment(userId: string, id: string, data: any) {
  await ensurePayment(userId, id);
  const payment = await prisma.payment.update({
    where: { id },
    data: {
      ...data,
      plannedDate: data.plannedDate ? new Date(data.plannedDate) : undefined,
      expectedDate: data.expectedDate === undefined ? undefined : data.expectedDate ? new Date(data.expectedDate) : null,
      actualDate: data.actualDate === undefined ? undefined : data.actualDate ? new Date(data.actualDate) : null
    }
  });
  await prisma.history.create({ data: { userId, type: "payment_updated", payload: { id, ...data } } });
  return mapPayment(payment);
}

export async function markPaymentPaid(userId: string, id: string, actualDateInput?: string) {
  const existing = await ensurePayment(userId, id);
  const actualDate = actualDateInput ? new Date(actualDateInput) : new Date();
  const effective = existing.expectedDate ?? existing.plannedDate;
  const status = resolvePaymentPaidStatus(effective, actualDate);
  const payment = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({ where: { id }, data: { actualDate, status } });
    await tx.operation.create({
      data: {
        userId,
        kind: OperationKind.expense,
        name: updated.name,
        amount: updated.amount,
        operationDate: actualDate,
        note: "Платёж исполнен"
      }
    });
    await tx.history.create({ data: { userId, type: "payment_paid", payload: { id, name: updated.name, amount: String(updated.amount), status } } });
    return updated;
  });
  return mapPayment(payment);
}

export async function deletePayment(userId: string, id: string) {
  await ensurePayment(userId, id);
  await prisma.payment.delete({ where: { id } });
  await prisma.history.create({ data: { userId, type: "payment_deleted", payload: { id } } });
  return { ok: true };
}

async function ensurePayment(userId: string, id: string) {
  const payment = await prisma.payment.findFirst({ where: { id, userId } });
  if (!payment) throw notFound("Payment not found");
  return payment;
}
