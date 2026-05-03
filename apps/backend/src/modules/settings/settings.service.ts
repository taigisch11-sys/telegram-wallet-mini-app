import { prisma } from "../../lib/prisma";
import { mapSettings } from "../finance/finance-mappers";

export async function updateStartBalance(userId: string, data: { startBalance: string; currentMonth?: string }) {
  const settings = await prisma.settings.update({
    where: { userId },
    data: {
      startBalance: data.startBalance,
      currentMonth: data.currentMonth ?? undefined
    }
  });
  await prisma.history.create({ data: { userId, type: "start_balance_updated", payload: data } });
  return mapSettings(settings);
}

export async function updateEditedBalance(userId: string, data: { editedBalance: string | null }) {
  const settings = await prisma.settings.update({ where: { userId }, data });
  await prisma.history.create({ data: { userId, type: "edited_balance_updated", payload: data } });
  return mapSettings(settings);
}
