import { prisma } from "../../lib/prisma";

export async function shouldProcessUpdate(
  updateId: bigint,
  store: {
    has: (id: bigint) => Promise<boolean>;
    add: (id: bigint) => Promise<void>;
  }
) {
  if (await store.has(updateId)) return false;
  await store.add(updateId);
  return true;
}

export const telegramUpdateStore = {
  async has(updateId: bigint) {
    const update = await prisma.telegramUpdate.findUnique({ where: { updateId } });
    return Boolean(update);
  },
  async add(updateId: bigint) {
    await prisma.telegramUpdate.create({ data: { updateId } });
  }
};
