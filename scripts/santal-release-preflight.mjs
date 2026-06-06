import { execFileSync } from "node:child_process";

const repo = "taigisch11-sys/telegram-wallet-mini-app";
const workerUrl = "https://santal-shift-app.taigisch11.workers.dev/";

const requiredSecrets = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "SANTAL_ADMIN_SETUP_TOKEN",
  "SANTAL_TELEGRAM_BOT_TOKEN",
  "SANTAL_TELEGRAM_TOKEN_ROTATED_AT",
  "SANTAL_TELEGRAM_WEBHOOK_SECRET",
  "SANTAL_GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "SANTAL_GOOGLE_PRIVATE_KEY"
];

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function fetchJson(url) {
  return JSON.parse(run("curl", ["--fail", "--silent", "--show-error", url]));
}

function githubSecrets() {
  const output = run("gh", ["secret", "list", "--repo", repo]);
  return new Set(
    output
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/)[0])
      .filter(Boolean)
  );
}

const secrets = githubSecrets();
const missingSecrets = requiredSecrets.filter((secret) => !secrets.has(secret));
const readiness = fetchJson(`${workerUrl}api/release/readiness`);

console.log("Santal Shift release preflight");
console.log(`Repository: ${repo}`);
console.log(`Worker: ${workerUrl}`);
console.log("");
console.log(`GitHub secrets: ${requiredSecrets.length - missingSecrets.length}/${requiredSecrets.length}`);
if (missingSecrets.length) {
  console.log("Missing secrets:");
  for (const secret of missingSecrets) console.log(`- ${secret}`);
} else {
  console.log("All required GitHub secrets are present.");
}
console.log("");
console.log(`Readiness: ${readiness.marketReadinessPercent}%`);
console.log(`Ready: ${readiness.ready ? "yes" : "no"}`);
if (readiness.criticalBlockers?.length) {
  console.log("Critical blockers:");
  for (const blocker of readiness.criticalBlockers) console.log(`- ${blocker.id}: ${blocker.fix}`);
}

console.log("");
console.log("Commands after new secret values are available:");
console.log(`gh secret set SANTAL_TELEGRAM_BOT_TOKEN --repo ${repo}`);
console.log(`gh secret set SANTAL_TELEGRAM_TOKEN_ROTATED_AT --repo ${repo} --body "2026-06-06T00:00:00.000Z"`);
console.log(`gh secret set SANTAL_GOOGLE_SERVICE_ACCOUNT_EMAIL --repo ${repo} --body "<service-account-email>"`);
console.log(`gh secret set SANTAL_GOOGLE_PRIVATE_KEY --repo ${repo} < google-private-key.txt`);
console.log(`gh workflow run deploy-santal-shift.yml --repo ${repo} --ref master`);
console.log(`gh run watch --repo ${repo} $(gh run list --repo ${repo} --workflow deploy-santal-shift.yml --limit 1 --json databaseId --jq ".[0].databaseId") --exit-status`);
console.log(`npm run santal:preflight`);

if (missingSecrets.length || !readiness.ready) {
  process.exitCode = 1;
}
