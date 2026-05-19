import { describe, expect, it } from "vitest";
import { SHEET_DEFINITIONS, dedupeLatestAssignments } from "./sheets";

describe("Santal Shift Google Sheets schema", () => {
  it("keeps every seed row aligned with its sheet headers", () => {
    for (const definition of SHEET_DEFINITIONS) {
      for (const row of definition.rows) {
        expect(row, `${definition.name} seed row`).toHaveLength(definition.headers.length);
      }
    }
  });

  it("seeds assignments into the assignments sheet instead of payout rows", () => {
    const assignmentsSheet = SHEET_DEFINITIONS.find((definition) => definition.name === "Назначения");

    expect(assignmentsSheet?.rows.length).toBeGreaterThan(0);
    expect(assignmentsSheet?.rows.every((row) => row[0].startsWith("assign_"))).toBe(true);
  });

  it("keeps the latest assignment row when Google Sheets is used as an append-only log", () => {
    const assignments = dedupeLatestAssignments([
      {
        id: "assign_1",
        shiftId: "shift_1",
        adminId: "admin_1",
        status: "assigned",
        source: "mini_app",
        createdAt: "2026-05-20T01:00:00.000Z",
        updatedAt: "2026-05-20T01:00:00.000Z"
      },
      {
        id: "assign_1",
        shiftId: "shift_1",
        adminId: "admin_1",
        status: "completed",
        source: "mini_app",
        createdAt: "2026-05-20T01:00:00.000Z",
        updatedAt: "2026-05-20T09:00:00.000Z"
      }
    ]);

    expect(assignments).toHaveLength(1);
    expect(assignments[0].status).toBe("completed");
  });
});
