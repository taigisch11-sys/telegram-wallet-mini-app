import { describe, expect, it } from "vitest";
import { shouldProcessUpdate } from "../modules/telegram/telegram.service";

describe("shouldProcessUpdate", () => {
  it("rejects already processed update ids", async () => {
    const store = new Set<bigint>([123n]);
    const result = await shouldProcessUpdate(123n, {
      has: async (id) => store.has(id),
      add: async (id) => {
        store.add(id);
      }
    });

    expect(result).toBe(false);
  });
});
