import { describe, expect, it } from "vitest";
import { resolvePaymentPaidStatus } from "../modules/payments/payments.service";

describe("resolvePaymentPaidStatus", () => {
  it("marks payment as on time when actual date matches effective date", () => {
    expect(resolvePaymentPaidStatus("2026-05-10", "2026-05-10")).toBe("paid_on_time");
  });
});
