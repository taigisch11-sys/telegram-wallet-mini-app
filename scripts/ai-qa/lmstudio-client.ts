export type AiQaReport = {
  role: string;
  status: "pass" | "warn" | "fail" | "skipped";
  release_blocking: boolean;
  findings: Array<{
    severity: "low" | "medium" | "high" | "blocker";
    area: string;
    evidence: string;
    recommendation: string;
  }>;
  error?: string;
};

const DEFAULT_BASE_URL = "http://127.0.0.1:1234/v1";

export async function resolveLmStudioModel() {
  const baseUrl = process.env.LMSTUDIO_BASE_URL ?? DEFAULT_BASE_URL;
  if (process.env.LMSTUDIO_MODEL) return process.env.LMSTUDIO_MODEL;

  const response = await fetch(`${baseUrl}/models`, { signal: AbortSignal.timeout(2500) });
  if (!response.ok) throw new Error(`LM Studio models request failed: ${response.status}`);
  const body = (await response.json()) as { data?: Array<{ id?: string }> };
  const model = body.data?.find((item) => item.id && !/embed|embedding/i.test(item.id))?.id ?? body.data?.[0]?.id;
  if (!model) throw new Error("LM Studio did not return any loaded model");
  return model;
}

export async function callLmStudio(role: string, rolePrompt: string, context: unknown): Promise<AiQaReport> {
  const baseUrl = process.env.LMSTUDIO_BASE_URL ?? DEFAULT_BASE_URL;
  const apiKey = process.env.LMSTUDIO_API_KEY ?? "lm-studio";
  const model = await resolveLmStudioModel();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    signal: AbortSignal.timeout(Number(process.env.AI_QA_TIMEOUT_MS ?? 180000)),
    body: JSON.stringify({
      model,
      temperature: Number(process.env.AI_QA_TEMPERATURE ?? 0.1),
      max_tokens: Number(process.env.AI_QA_MAX_TOKENS ?? 2048),
      messages: [
        { role: "system", content: rolePrompt },
        { role: "user", content: JSON.stringify(context, null, 2) }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`LM Studio chat request failed: ${response.status}${message ? ` ${message.slice(0, 500)}` : ""}`);
  }
  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string; reasoning_content?: string } }> };
  const message = body.choices?.[0]?.message;
  return parseReport(role, message?.content || message?.reasoning_content || "");
}

export function skippedReport(role: string, error: string): AiQaReport {
  return {
    role,
    status: "skipped",
    release_blocking: process.env.AI_QA_REQUIRE === "1",
    findings: [],
    error
  };
}

function parseReport(role: string, content: string): AiQaReport {
  try {
    const parsed = parseFirstValidReport(content);
    return {
      role,
      status: parsed.status ?? "warn",
      release_blocking: Boolean(parsed.release_blocking),
      findings: Array.isArray(parsed.findings) ? parsed.findings : []
    };
  } catch (error) {
    return {
      role,
      status: "warn",
      release_blocking: process.env.AI_QA_REQUIRE === "1",
      findings: [
        {
          severity: "medium",
          area: "ai-qa",
          evidence: `LM Studio response was not valid JSON: ${content.slice(0, 240)}`,
          recommendation: "Use a chat/instruct model with JSON-following behavior or rerun the agent."
        }
      ],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function extractJson(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("AI response did not contain JSON");
  return trimmed.slice(start, end + 1);
}

function parseFirstValidReport(content: string) {
  for (const candidate of extractJsonCandidates(content)) {
    try {
      const parsed = JSON.parse(candidate) as AiQaReport;
      if (parsed.status && Array.isArray(parsed.findings)) return parsed;
    } catch {
      // Try the next balanced object; local models often include examples before the final JSON.
    }
  }
  return JSON.parse(extractJson(content)) as AiQaReport;
}

function extractJsonCandidates(content: string) {
  const candidates: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        candidates.push(content.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return candidates.reverse();
}
