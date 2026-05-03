import { prisma } from "../../lib/prisma";
import { mapHistory } from "../finance/finance-mappers";

export async function listHistory(userId: string) {
  return (await prisma.history.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 })).map(mapHistory);
}
