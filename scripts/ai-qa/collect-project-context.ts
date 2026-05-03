import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function run(command: string) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function readJson(path: string) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function listFiles(path: string) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { recursive: true })
    .map(String)
    .filter((file) => /\.(ts|tsx|json|md|css)$/.test(file))
    .slice(0, 80);
}

function readSmall(path: string) {
  if (!existsSync(path)) return "";
  const text = readFileSync(path, "utf8");
  if (text.length <= 1200) return text;
  return `${text.slice(0, 800)}\n\n/* ...middle omitted for AI-QA context budget... */\n\n${text.slice(-400)}`;
}

export function collectProjectContext() {
  const rootPackage = readJson("package.json");
  const scenario = readJson(join("qa", "ai", "scenarios", "mini-app-release.json"));
  const frontendTests = listFiles(join("apps", "frontend", "src", "test"));
  const backendTests = listFiles(join("apps", "backend", "src", "test"));

  return {
    generatedAt: new Date().toISOString(),
    git: {
      branch: run("git branch --show-current"),
      status: run("git status --short"),
      diffStat: run("git diff --stat -- . ':!qa/ai/reports'"),
      changedFiles: run("git diff --name-only -- . ':!qa/ai/reports'")
    },
    scripts: rootPackage?.scripts ?? {},
    scenario,
    tests: {
      frontend: frontendTests,
      backend: backendTests
    },
    selectedFiles: {
      app: readSmall(join("apps", "frontend", "src", "app", "App.tsx")),
      shell: readSmall(join("apps", "frontend", "src", "components", "layout", "shell.tsx")),
      accounts: readSmall(join("apps", "frontend", "src", "screens", "accounts-screen.tsx")),
      plan: readSmall(join("apps", "frontend", "src", "screens", "plan-screen.tsx")),
      wallet: readSmall(join("apps", "frontend", "src", "screens", "wallet-screen.tsx")),
      sharedTypes: readSmall(join("packages", "shared", "src", "types.ts"))
    }
  };
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(collectProjectContext(), null, 2));
}
