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

  it("exports the same seven non-Kievskaya Tomsk branches to Google Sheets", () => {
    const branchesSheet = SHEET_DEFINITIONS.find((definition) => definition.name === "Филиалы");

    expect(branchesSheet?.rows.map((row) => row[0])).toEqual([
      "branch_csm2",
      "branch_csm3",
      "branch_csm4",
      "branch_csm6",
      "branch_csm7",
      "branch_csm9",
      "branch_csm10"
    ]);
    expect(branchesSheet?.rows.some((row) => row[3].includes("Киевская"))).toBe(false);
  });

  it("exports only administrator and doctor assistant roles to dictionaries and rates", () => {
    const dictionariesSheet = SHEET_DEFINITIONS.find((definition) => definition.name === "Справочники");
    const ratesSheet = SHEET_DEFINITIONS.find((definition) => definition.name === "Ставки");

    expect(dictionariesSheet?.rows.map((row) => row[0]).filter(Boolean)).toEqual(["admin", "doctor_assistant"]);
    expect(ratesSheet?.rows.map((row) => row[3])).toEqual(["admin", "doctor_assistant"]);
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
