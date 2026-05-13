import { applyOperationEntries, distributeUnallocatedMovement, generateMonthlySchedule } from "@wallet/shared";
import { describe, expect, it } from "vitest";

describe("operation ledger helpers", () => {
  it("applies a debt repayment without changing net worth", () => {
    const result = applyOperationEntries(
      {
        accounts: [{ id: "debit-card", balance: 50000 }],
        debts: [{ id: "credit-card", amount: -30000 }]
      },
      [
        { targetType: "account", targetId: "debit-card", amount: -10000 },
        { targetType: "debt", targetId: "credit-card", amount: 10000 }
      ]
    );

    expect(result.accounts[0].balance).toBe(40000);
    expect(result.debts[0].amount).toBe(-20000);
    expect(result.netDelta).toBe(0);
  });

  it("generates monthly payments with a different final amount", () => {
    const rows = generateMonthlySchedule({
      startDate: "2026-05-22",
      count: 11,
      amount: "15485",
      finalAmount: "12500"
    });

    expect(rows).toHaveLength(11);
    expect(rows[0]).toMatchObject({ amount: "15485.00", plannedDate: "2026-05-22" });
    expect(rows[9]).toMatchObject({ amount: "15485.00", plannedDate: "2027-02-22" });
    expect(rows[10]).toMatchObject({ amount: "12500.00", plannedDate: "2027-03-22" });
  });

  it("distributes unallocated movement evenly by day between balance checks", () => {
    const rows = distributeUnallocatedMovement({
      amount: "-700.00",
      from: "2026-05-01T10:00:00.000Z",
      to: "2026-05-07T10:00:00.000Z"
    });

    expect(rows).toHaveLength(7);
    expect(rows[0]).toMatchObject({ amount: "-100.00", date: "2026-05-01" });
    expect(rows[6]).toMatchObject({ amount: "-100.00", date: "2026-05-07" });
    expect(rows.reduce((sum, row) => sum + Number(row.amount), 0)).toBe(-700);
  });
});
