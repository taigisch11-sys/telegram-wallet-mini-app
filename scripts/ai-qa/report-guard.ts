import { execSync } from "node:child_process";
import type { AiQaReport } from "./lmstudio-client";

type GuardOptions = {
  trackedPaths?: Set<string>;
};

const pathPattern = /(?:[A-Za-z]:)?(?:\.{1,2}[\\/])?(?:(?:[\w.-]+)[\\/])+[\w.-]+\.(?:tsx?|json|md|css|sql|toml|ya?ml)|\b[\w.-]+\.(?:tsx?|json|md|css|sql|toml|ya?ml)\b/g;

export function sanitizeAiQaReportForRelease(report: AiQaReport, options: GuardOptions = {}): AiQaReport {
  const trackedPaths = options.trackedPaths ?? collectTrackedPaths();
  const normalizedTrackedPaths = new Set([...trackedPaths].map(normalizeReportedPath));

  let hasSupportedBlockingFinding = false;
  const findings = (report.findings ?? []).map((finding) => {
    const severity = finding.severity;
    const isBlockingSeverity = severity === "high" || severity === "blocker";
    if (!isBlockingSeverity) return finding;

    if (hasTrackedFileEvidence(finding, normalizedTrackedPaths)) {
      hasSupportedBlockingFinding = true;
      return finding;
    }

    return {
      ...finding,
      severity: "medium" as const,
      area: "ai-qa",
      evidence: `AI-QA warning only; no tracked file evidence found. ${finding.evidence ?? ""}`.trim()
    };
  });

  return {
    ...report,
    status: hasSupportedBlockingFinding ? "fail" : report.status === "fail" ? "warn" : report.status,
    release_blocking: hasSupportedBlockingFinding,
    findings
  };
}

function collectTrackedPaths() {
  try {
    return new Set(
      execSync("git ls-files", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    );
  } catch {
    return new Set<string>();
  }
}

function hasTrackedFileEvidence(finding: Record<string, unknown>, trackedPaths: Set<string>) {
  const text = Object.values(finding)
    .filter((value) => typeof value === "string")
    .join(" ");
  const paths = text.match(pathPattern) ?? [];
  return paths.map(normalizeReportedPath).some((path) => trackedPaths.has(path));
}

function normalizeReportedPath(path: string) {
  const cleaned = path
    .trim()
    .replace(/^['"`(]+|['"`),.;:]+$/g, "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");

  const cwd = process.cwd().replace(/\\/g, "/");
  return cleaned.startsWith(`${cwd}/`) ? cleaned.slice(cwd.length + 1) : cleaned;
}
