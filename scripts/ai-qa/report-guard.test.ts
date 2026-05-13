import { describe, expect, it } from "vitest";
import { sanitizeAiQaReportForRelease } from "./report-guard";
import type { AiQaReport } from "./lmstudio-client";

describe("AI-QA release report guard", () => {
  it("demotes release-blocking findings when they do not cite tracked project files", () => {
    const report: AiQaReport = {
      role: "financial-analyst",
      status: "fail",
      release_blocking: true,
      findings: [
        {
          severity: "high",
          area: "global",
          evidence: "File app.tsx line 103 says realWallet.refresh();",
          recommendation: "Fix the data-loss risk."
        }
      ]
    };

    const sanitized = sanitizeAiQaReportForRelease(report, {
      trackedPaths: new Set(["apps/frontend/src/app/App.tsx"])
    });

    expect(sanitized.release_blocking).toBe(false);
    expect(sanitized.status).toBe("warn");
    expect(sanitized.findings[0].severity).toBe("medium");
    expect(sanitized.findings[0].area).toBe("ai-qa");
  });

  it("keeps release-blocking findings when they cite a tracked project file", () => {
    const report: AiQaReport = {
      role: "ux-critic",
      status: "fail",
      release_blocking: true,
      findings: [
        {
          severity: "high",
          area: "wallet",
          evidence: "apps/frontend/src/app/App.tsx renders a primary action with no label.",
          recommendation: "Add an accessible label."
        }
      ]
    };

    const sanitized = sanitizeAiQaReportForRelease(report, {
      trackedPaths: new Set(["apps/frontend/src/app/App.tsx"])
    });

    expect(sanitized.release_blocking).toBe(true);
    expect(sanitized.status).toBe("fail");
    expect(sanitized.findings[0].severity).toBe("high");
  });
});
