import { describe, expect, it } from "vitest";
import {
  buildScheduleBoard,
  calculateShiftPay,
  createDemoState,
  deriveMoneySummary,
  takeShift
} from "./domain";

describe("Santal Shift domain", () => {
  it("calculates fixed medical shift pay with holiday multiplier and bonus", () => {
    const pay = calculateShiftPay({
      hourlyRate: 420,
      plannedHours: 6,
      holidayMultiplier: 1.5,
      bonusAmount: 300
    });

    expect(pay).toBe(4080);
  });

  it("takes an open shift, creates an assignment and fills slots", () => {
    const state = createDemoState("2026-05-20");
    const result = takeShift(state, {
      shiftId: "shift_20260520_central_morning",
      adminId: "admin_nikita",
      nowIso: "2026-05-20T03:00:00.000Z"
    });

    expect(result.ok).toBe(true);
    expect(result.state.assignments).toHaveLength(4);
    expect(result.state.shifts.find((shift) => shift.id === "shift_20260520_central_morning")?.assignedCount).toBe(2);
    expect(result.state.shifts.find((shift) => shift.id === "shift_20260520_central_morning")?.status).toBe("filled");
  });

  it("rejects duplicate and overfilled shift requests", () => {
    const state = createDemoState("2026-05-20");
    const first = takeShift(state, {
      shiftId: "shift_20260520_central_morning",
      adminId: "admin_nikita",
      nowIso: "2026-05-20T03:00:00.000Z"
    });
    const duplicate = takeShift(first.state, {
      shiftId: "shift_20260520_central_morning",
      adminId: "admin_nikita",
      nowIso: "2026-05-20T03:01:00.000Z"
    });
    const overfill = takeShift(first.state, {
      shiftId: "shift_20260520_central_morning",
      adminId: "admin_sergey",
      nowIso: "2026-05-20T03:02:00.000Z"
    });

    expect(duplicate.ok).toBe(false);
    expect(duplicate.reason).toBe("duplicate");
    expect(overfill.ok).toBe(false);
    expect(overfill.reason).toBe("filled");
  });

  it("rejects overlapping confirmed shifts for the same administrator", () => {
    const state = createDemoState("2026-05-20");
    const result = takeShift(state, {
      shiftId: "shift_20260520_central_morning",
      adminId: "admin_olga",
      nowIso: "2026-05-20T03:00:00.000Z"
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("overlap");
  });

  it("builds a branch-day schedule board for Google Sheets chessboard view", () => {
    const board = buildScheduleBoard(createDemoState("2026-05-20"));
    const today = board.find((day) => day.date === "2026-05-20");

    expect(today).toMatchObject({
      date: "2026-05-20",
      branches: [
        { branchId: "branch_central", required: 3, assigned: 1, open: 2 },
        { branchId: "branch_children", required: 1, assigned: 1, open: 0 }
      ]
    });
  });

  it("summarizes expected, earned and paid money for the administrator", () => {
    const state = createDemoState("2026-05-20");
    const summary = deriveMoneySummary(state, "admin_olga");

    expect(summary.expected).toBe(11160);
    expect(summary.earned).toBe(4560);
    expect(summary.paid).toBe(0);
  });
});
