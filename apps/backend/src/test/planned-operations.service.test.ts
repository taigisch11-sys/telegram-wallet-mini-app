import { describe, expect, it } from "vitest";
import { assertDebtRepaymentDoesNotOverpay } from "../modules/planned-operations/planned-operations.service";

describe("planned operation debt repayment validation", () => {
  it("rejects a debt repayment that is larger than the current debt", () => {
    expect(() => assertDebtRepaymentDoesNotOverpay("10000", "-8000")).toThrow("Сумма погашения больше текущего долга");
  });

  it("allows a debt repayment up to the current debt", () => {
    expect(() => assertDebtRepaymentDoesNotOverpay("8000", "-8000")).not.toThrow();
  });
});
