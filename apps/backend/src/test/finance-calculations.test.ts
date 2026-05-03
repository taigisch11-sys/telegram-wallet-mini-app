import { describe, expect, it } from "vitest";
import { calculateDashboardBalances } from "../modules/finance/finance-calculations";

describe("calculateDashboardBalances", () => {
  it("computes model and drift values", () => {
    const result = calculateDashboardBalances({
      startBalance: 1000,
      editedBalance: 700,
      accountBalance: 820,
      debtBalance: -150,
      incomes: [{ amount: 600, status: "received_on_time" }],
      payments: [{ amount: 900, status: "paid_on_time" }]
    });

    expect(result).toEqual({
      accountBalance: 820,
      debtBalance: -150,
      netBalance: 670,
      calculatedBalance: 700,
      currentBalance: 700,
      additionalExpenses: 0,
      freeMoney: 700
    });
  });
});
