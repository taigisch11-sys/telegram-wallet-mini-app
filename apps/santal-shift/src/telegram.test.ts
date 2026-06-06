import { describe, expect, it, vi } from "vitest";
import { callTelegramApi } from "./telegram";

describe("Telegram API client", () => {
  it("fails closed when bot token is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(callTelegramApi(undefined, "sendMessage", { chat_id: 1, text: "test" })).rejects.toThrow(
      "Telegram bot token is not configured"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
