import { describe, expect, it } from "vitest";
import { resolveIncomeReceivedStatus } from "../modules/income/income.service";

describe("resolveIncomeReceivedStatus", () => {
  it("marks late income when actual date is after effective date", () => {
    expect(resolveIncomeReceivedStatus("2026-05-10", "2026-05-12")).toBe("received_late");
  });
});
