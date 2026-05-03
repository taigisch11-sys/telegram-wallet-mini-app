import { describe, expect, it } from "vitest";
import { normalizeDebtInputAmount } from "../modules/debts/debts.service";

describe("normalizeDebtInputAmount", () => {
  it("stores user-entered positive debt as a negative balance", () => {
    expect(normalizeDebtInputAmount("25000")).toBe("-25000.00");
  });

  it("keeps an already negative debt negative", () => {
    expect(normalizeDebtInputAmount("-12500.50")).toBe("-12500.50");
  });
});
