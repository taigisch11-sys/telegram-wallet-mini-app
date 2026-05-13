import { describe, expect, it } from "vitest";
import type { DashboardStateDto } from "@wallet/shared";
import { emptyState } from "../mock/state";
import { normalizeDashboardState } from "../hooks/use-state";

describe("state normalization", () => {
  it("keeps the app compatible with legacy API responses without operation arrays", () => {
    const legacy = { ...emptyState };
    delete (legacy as Partial<DashboardStateDto>).categories;
    delete (legacy as Partial<DashboardStateDto>).operations;
    delete (legacy as Partial<DashboardStateDto>).plannedOperations;

    const normalized = normalizeDashboardState(legacy as DashboardStateDto);

    expect(normalized.categories.length).toBeGreaterThan(0);
    expect(normalized.operations).toEqual([]);
    expect(normalized.plannedOperations).toEqual([]);
  });
});
