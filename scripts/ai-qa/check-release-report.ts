import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeAiQaReportForRelease } from "./report-guard";
import type { AiQaReport } from "./lmstudio-client";

const path = join("qa", "ai", "reports", "suite-latest.json");

if (!existsSync(path)) {
  console.error("AI-QA report not found. Run npm run qa:ai first.");
  process.exit(1);
}

const suite = JSON.parse(readFileSync(path, "utf8")) as {
  release_blocking?: boolean;
  reports?: AiQaReport[];
};

const reports = (suite.reports ?? []).map((report) => sanitizeAiQaReportForRelease(report));
const blockingFindings = reports.flatMap((report) =>
  (report.findings ?? [])
    .filter((finding) => finding.severity === "high" || finding.severity === "blocker")
    .map((finding) => ({ role: report.role, ...finding }))
);

if (reports.some((report) => report.release_blocking) || blockingFindings.length > 0) {
  console.error(JSON.stringify({ message: "AI-QA blocks release", blockingFindings }, null, 2));
  process.exit(1);
}

console.log("AI-QA release report is acceptable.");
