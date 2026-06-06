import { describe, expect, it } from "vitest";
import { renderAppHtml } from "./ui";

describe("Santal Shift UI shell", () => {
  it("renders API error messages in the loading failure state", () => {
    const html = renderAppHtml();

    expect(html).toContain('const message = error.payload?.message || "Не удалось загрузить приложение. Обновите страницу или откройте Mini App из Telegram."');
    expect(html).toContain("root.innerHTML = '<div class=\"empty\">' + esc(message) + '</div>'");
  });
});
