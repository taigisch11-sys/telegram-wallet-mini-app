import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { roleNames, runAgent, writeAgentReport } from "./run-agent";

const reports = [];

for (const role of roleNames) {
  const report = await runAgent(role);
  writeAgentReport(role, report);
  reports.push(report);
}

const releaseBlocking = reports.some((report) => report.release_blocking || report.findings.some((finding) => finding.severity === "high" || finding.severity === "blocker"));
const suite = {
  generatedAt: new Date().toISOString(),
  status: releaseBlocking ? "fail" : reports.some((report) => report.status === "warn" || report.status === "skipped") ? "warn" : "pass",
  release_blocking: releaseBlocking,
  reports
};

mkdirSync(join("qa", "ai", "reports"), { recursive: true });
const path = join("qa", "ai", "reports", `suite-latest.json`);
writeFileSync(path, JSON.stringify(suite, null, 2), "utf8");
console.log(JSON.stringify({ path, suite }, null, 2));
if (releaseBlocking) process.exit(1);
