import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { collectProjectContext } from "./collect-project-context";
import { callLmStudio, skippedReport, type AiQaReport } from "./lmstudio-client";

export const roleNames = ["ux-critic", "qa-navigation", "copy-checker", "financial-analyst", "regression-guardian"] as const;
export type RoleName = (typeof roleNames)[number];

export async function runAgent(role: RoleName): Promise<AiQaReport> {
  const rolePath = join("qa", "ai", "roles", `${role}.md`);
  const rolePrompt = readFileSync(rolePath, "utf8");
  const context = collectProjectContext();

  try {
    return await callLmStudio(role, rolePrompt, context);
  } catch (error) {
    return skippedReport(role, error instanceof Error ? error.message : String(error));
  }
}

export function writeAgentReport(role: string, report: AiQaReport) {
  mkdirSync(join("qa", "ai", "reports"), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join("qa", "ai", "reports", `${stamp}-${role}.json`);
  writeFileSync(path, JSON.stringify(report, null, 2), "utf8");
  return path;
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const role = process.argv[2] as RoleName | undefined;
  if (!role || !roleNames.includes(role)) {
    console.error(`Usage: tsx scripts/ai-qa/run-agent.ts ${roleNames.join("|")}`);
    process.exit(2);
  }

  const report = await runAgent(role);
  const path = writeAgentReport(role, report);
  console.log(JSON.stringify({ path, report }, null, 2));
  if (report.release_blocking) process.exit(1);
}
